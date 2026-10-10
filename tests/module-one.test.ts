import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import type { getDb } from "../lib/db";
import { createAuth } from "../lib/auth-core";
import {
  canEdit,
  canReview,
  canViewPortfolio,
  detectImage,
  isVerifiedStudent,
} from "../lib/policy";
import { portfolioInput, profileInput } from "../lib/validation";
import {
  changeStatus,
  ownedPortfolio,
  reorderPortfolio,
  reviewStudent,
  submitVerification,
} from "../lib/services";

const postgres = new PGlite();
const db = drizzle(postgres, { schema });
// Both drivers execute real PostgreSQL; the production type uses Neon's Pool.
const serviceDb = db as unknown as ReturnType<typeof getDb>;
const emails: { to: string; subject: string; url: string }[] = [];
const auth = createAuth(serviceDb, {
  secret: "test-only-secret-with-at-least-32-characters-for-local-tests",
  baseURL: "http://localhost:3000",
  rateLimit: false,
  sendMail: async (to, subject, url) => {
    emails.push({ to, subject, url });
  },
});
const password = "A-strong-test-password-123";
let alice: schema.User, bob: schema.User, admin: schema.User;
async function signup(
  name: string,
  email: string,
  extra: Record<string, unknown> = {},
) {
  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ name, email, password, ...extra }),
    }),
  );
}
async function verifyEmail(email: string) {
  const entry = emails.findLast(
    (e) => e.to === email && e.subject.startsWith("Verify"),
  );
  expect(entry).toBeDefined();
  const result = await auth.handler(new Request(entry!.url));
  expect(result.status).toBeLessThan(400);
}
async function login(email: string, pw = password) {
  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email, password: pw }),
    }),
  );
}
beforeAll(async () => {
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await postgres.exec(readFileSync(`drizzle/${file}`, "utf8"));
}, 30000);
afterAll(async () => {
  await postgres.close();
});

describe("Module 1 against real PostgreSQL (PGlite)", () => {
  it("allows signup and sign-in without email delivery when verification is disabled", async () => {
    const sentBefore = emails.length;
    const optionalAuth = createAuth(serviceDb, {
      secret: "test-only-secret-with-at-least-32-characters-for-local-tests",
      baseURL: "http://localhost:3000",
      rateLimit: false,
      emailVerificationEnabled: false,
      sendMail: async (to, subject, url) => {
        emails.push({ to, subject, url });
      },
    });
    const request = (path: string) =>
      optionalAuth.handler(
        new Request(`http://localhost:3000/api/auth/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
          },
          body: JSON.stringify({
            name: "Optional Email",
            email: "optional@example.com",
            password,
          }),
        }),
      );
    const signedUp = await request("sign-up/email");
    expect(signedUp.status).toBe(200);
    expect(signedUp.headers.get("set-cookie")).toContain("HttpOnly");
    const [account] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "optional@example.com"));
    expect(account.emailVerified).toBe(false);
    expect(emails).toHaveLength(sentBefore);
    const signedIn = await request("sign-in/email");
    expect(signedIn.status).toBe(200);
    expect(signedIn.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("registers and normalizes email, rejects injected admin/status fields", async () => {
    const response = await signup("Alice Student", "Alice@EXAMPLE.com", {
      accessLevel: "administrator",
      status: "suspended",
      emailVerified: true,
      preferredMode: "student",
    });
    expect(response.status).toBe(200);
    [alice] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "alice@example.com"));
    expect(alice.accessLevel).toBe("user");
    expect(alice.status).toBe("active");
    expect(alice.emailVerified).toBe(false);
    const [account] = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, alice.id));
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe(password);
  });
  it("does not grant a session before email verification", async () => {
    expect((await login("alice@example.com")).status).toBe(403);
  });
  it("verifies email and signs in using a secure HTTP-only session cookie", async () => {
    await verifyEmail("alice@example.com");
    const response = await login("alice@example.com");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    [alice] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, alice.id));
    expect(alice.emailVerified).toBe(true);
  });
  it("does not duplicate accounts for a normalized email", async () => {
    await signup("Another Alice", "ALICE@example.com");
    const matches = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "alice@example.com"));
    expect(matches).toHaveLength(1);
  });
  it("rejects an invalid workspace mode and wrong password", async () => {
    expect(
      (
        await signup("Wrong Role", "wrong@example.com", {
          preferredMode: "administrator",
        })
      ).status,
    ).toBeGreaterThanOrEqual(400);
    expect((await login("alice@example.com", "not-the-password")).status).toBe(
      401,
    );
  });
  it("creates another user and a controlled administrator for domain tests", async () => {
    expect(
      (
        await signup("Bob Employer", "bob@example.com", {
          preferredMode: "employer",
        })
      ).status,
    ).toBe(200);
    await verifyEmail("bob@example.com");
    expect((await signup("Admin Reviewer", "admin@example.com")).status).toBe(
      200,
    );
    await verifyEmail("admin@example.com");
    [bob] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "bob@example.com"));
    [admin] = await db
      .update(schema.user)
      .set({ accessLevel: "administrator" })
      .where(eq(schema.user.email, "admin@example.com"))
      .returning();
  });
  it("rejects private portfolio reads and edits by another member", async () => {
    await db.insert(schema.portfolio).values({
      id: "project-alice",
      ownerId: alice.id,
      title: "Test project",
      description: "A private portfolio project",
      visibility: "private",
    });
    expect(
      canViewPortfolio(bob, { ownerId: alice.id, visibility: "private" }),
    ).toBe(false);
    expect(canEdit(bob, alice.id)).toBe(false);
    await expect(
      ownedPortfolio(serviceDb, bob, "project-alice"),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      canViewPortfolio(null, { ownerId: alice.id, visibility: "public" }),
    ).toBe(true);
    await expect(
      reorderPortfolio(serviceDb, bob, ["project-alice"]),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("validates safe project URLs and forbids privilege fields on profile updates", () => {
    expect(
      profileInput.safeParse({
        name: "Alice",
        bio: "",
        preferredMode: "student",
        accessLevel: "administrator",
      }).success,
    ).toBe(false);
    expect(
      portfolioInput.safeParse({
        title: "Project",
        description: "A valid long description",
        skills: [],
        projectUrl: "javascript:alert(1)",
        projectDate: "",
        visibility: "public",
        mediaId: null,
      }).success,
    ).toBe(false);
  });
  it("checks verification evidence ownership and permits only one pending request", async () => {
    await db.insert(schema.media).values({
      id: "alice-id",
      ownerId: alice.id,
      purpose: "university_id",
      storageKey: "private/alice",
      mimeType: "image/jpeg",
      sizeBytes: 100,
      checksum: "test",
    });
    await expect(
      submitVerification(serviceDb, bob, {
        university: "Test University",
        mediaId: "alice-id",
      }),
    ).rejects.toMatchObject({ status: 400 });
    const request = await submitVerification(serviceDb, alice, {
      university: "Test University",
      mediaId: "alice-id",
    });
    expect(isVerifiedStudent(request.status)).toBe(false);
    await expect(
      submitVerification(serviceDb, alice, {
        university: "Test University",
        mediaId: "alice-id",
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      reviewStudent(serviceDb, bob, request.id, "approved", "Looks valid"),
    ).rejects.toMatchObject({ status: 403 });
    await reviewStudent(
      serviceDb,
      admin,
      request.id,
      "approved",
      "University ID reviewed",
    );
    const [reviewed] = await db
      .select()
      .from(schema.studentVerification)
      .where(eq(schema.studentVerification.id, request.id));
    expect(isVerifiedStudent(reviewed.status)).toBe(true);
    await expect(
      reviewStudent(
        serviceDb,
        admin,
        request.id,
        "rejected",
        "Second decision",
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(canReview(admin, admin.id)).toBe(false);
    const events = await db
      .select()
      .from(schema.audit)
      .where(eq(schema.audit.targetId, request.id));
    expect(events).toHaveLength(1);
  });
  it("suspends atomically, revokes sessions, blocks new login and audits exactly once", async () => {
    expect((await login("alice@example.com")).status).toBe(200);
    await expect(
      changeStatus(serviceDb, bob, alice.id, "suspended", "Invalid attempt"),
    ).rejects.toMatchObject({ status: 403 });
    await changeStatus(
      serviceDb,
      admin,
      alice.id,
      "suspended",
      "Moderation test reason",
    );
    expect(
      await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.userId, alice.id)),
    ).toHaveLength(0);
    expect((await login("alice@example.com")).status).toBeGreaterThanOrEqual(
      400,
    );
    await changeStatus(
      serviceDb,
      admin,
      alice.id,
      "suspended",
      "Retry moderation action",
    );
    expect(
      await db
        .select()
        .from(schema.audit)
        .where(eq(schema.audit.targetId, alice.id)),
    ).toHaveLength(1);
    await expect(
      changeStatus(
        serviceDb,
        admin,
        admin.id,
        "suspended",
        "Self-suspension attempt",
      ),
    ).rejects.toMatchObject({ status: 403 });
    await changeStatus(
      serviceDb,
      admin,
      alice.id,
      "active",
      "Restore test account",
    );
  });
  it("resets passwords once, rejects reuse and revokes prior sessions", async () => {
    await login("bob@example.com");
    await auth.api.requestPasswordReset({
      body: {
        email: "bob@example.com",
        redirectTo: "http://localhost:3000/reset-password",
      },
    });
    const reset = emails.findLast(
      (e) => e.to === "bob@example.com" && e.subject.startsWith("Reset"),
    );
    expect(reset).toBeDefined();
    const url = new URL(reset!.url);
    const token = url.pathname.split("/").at(-1)!;
    await auth.api.resetPassword({
      body: { token, newPassword: "New-strong-test-password-456" },
    });
    expect(
      await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.userId, bob.id)),
    ).toHaveLength(0);
    await expect(
      auth.api.resetPassword({ body: { token, newPassword: password } }),
    ).rejects.toBeDefined();
    expect((await login("bob@example.com")).status).toBe(401);
    expect(
      (await login("bob@example.com", "New-strong-test-password-456")).status,
    ).toBe(200);
  });
  it("rejects disguised HTML and SVG image uploads", () => {
    expect(
      detectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),
    ).toBeNull();
    expect(detectImage(new Uint8Array([255, 216, 255, 1]))).toBe("image/jpeg");
  });
  it("rejects expired password-reset tokens", async () => {
    await auth.api.requestPasswordReset({
      body: {
        email: "alice@example.com",
        redirectTo: "http://localhost:3000/reset-password",
      },
    });
    const reset = emails.findLast(
      (e) => e.to === "alice@example.com" && e.subject.startsWith("Reset"),
    )!;
    const token = new URL(reset.url).pathname.split("/").at(-1)!;
    const records = await db.select().from(schema.verification);
    expect(records.some((record) => record.identifier.includes(token))).toBe(
      false,
    );
    await db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) });
    await expect(
      auth.api.resetPassword({
        body: { token, newPassword: "Another-test-password-789" },
      }),
    ).rejects.toBeDefined();
  });
  it("enforces the configured database-backed login rate limit", async () => {
    const limitedAuth = createAuth(serviceDb, {
      secret: "another-test-only-secret-at-least-32-characters",
      baseURL: "http://localhost:3000",
      sendMail: async () => {},
      rateLimit: true,
    });
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 7; attempt++) {
      const response = await limitedAuth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
            "x-forwarded-for": "192.0.2.25",
          },
          body: JSON.stringify({ email: "nonexistent@example.com", password }),
        }),
      );
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
    expect((await db.select().from(schema.rateLimit)).length).toBeGreaterThan(
      0,
    );
  });
});
