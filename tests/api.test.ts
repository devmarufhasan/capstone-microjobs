import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
vi.mock("@/lib/storage", () => ({
  storageConfigured: () => true,
  storeFile: vi.fn(async () => {}),
  removeFile: vi.fn(async () => {}),
  fileUrl: vi.fn(async () => "https://storage.example/temporary-test-link"),
}));
import { POST as mediaPost } from "../app/api/media/route";
import { GET as mediaGet } from "../app/api/media/[id]/route";
import { GET as ownCasesGet, POST as casePost } from "../app/api/cases/route";
import { GET as adminCasesGet } from "../app/api/admin/cases/route";
import { PATCH as caseReviewPatch } from "../app/api/admin/cases/[id]/route";
const { state } = vi.hoisted(() => ({
  state: { userId: null as string | null, db: null as unknown },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/auth", () => ({
  authConfigured: () => true,
  getAuth: () => ({
    api: {
      getSession: async () =>
        state.userId ? { user: { id: state.userId } } : null,
    },
  }),
}));
import {
  GET as profileGet,
  PATCH as profilePatch,
} from "../app/api/users/me/route";
import { POST as portfolioPost } from "../app/api/portfolio/route";
import {
  PATCH as portfolioPatch,
  DELETE as portfolioDelete,
} from "../app/api/portfolio/[id]/route";
import { PATCH as adminPatch } from "../app/api/admin/users/[id]/route";
import { POST as verificationPost } from "../app/api/verification/student-id/route";
import { DELETE as revokeSession } from "../app/api/sessions/[id]/route";
const postgres = new PGlite();
const db = drizzle(postgres, { schema });
state.db = db;
function request(
  path: string,
  method = "GET",
  body?: unknown,
  origin = "http://localhost:3000",
) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const context = (id: string) => ({ params: Promise.resolve({ id }) });
beforeAll(async () => {
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await postgres.exec(readFileSync(`drizzle/${file}`, "utf8"));
  await db.insert(schema.user).values([
    {
      id: "alice",
      name: "Alice Student",
      email: "alice@test.example",
      emailVerified: true,
    },
    {
      id: "bob",
      name: "Bob Employer",
      email: "bob@test.example",
      emailVerified: true,
    },
    {
      id: "carol",
      name: "Carol Admin",
      email: "carol@test.example",
      emailVerified: true,
      accessLevel: "administrator",
    },
  ]);
});
afterAll(async () => {
  await postgres.close();
});
describe("Module 1 moderation case schema", () => {
  it("stores user cases with an open default and rejects invalid parties and descriptions", async () => {
    const [created] = await db
      .insert(schema.moderationCase)
      .values({
        id: "account-report-1",
        reporterId: "alice",
        subjectUserId: "bob",
        type: "report",
        description: "Misleading account information",
      })
      .returning();
    expect(created.status).toBe("open");
    await expect(
      db.insert(schema.moderationCase).values({
        id: "invalid-self-report",
        reporterId: "alice",
        subjectUserId: "alice",
        type: "report",
        description: "Self report",
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.moderationCase).values({
        id: "invalid-empty-report",
        reporterId: "alice",
        subjectUserId: "bob",
        type: "report",
        description: "   ",
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.moderationCase).values({
        id: "invalid-subject",
        reporterId: "alice",
        subjectUserId: "missing",
        type: "report",
        description: "Missing account",
      }),
    ).rejects.toThrow();
  });
});
describe("Account report and dispute flow", () => {
  it("lets a verified user submit a case, keeps their history private, and audits admin resolution", async () => {
    state.userId = "alice";
    const created = await casePost(
      request("/api/cases", "POST", {
        subjectUserId: "bob",
        type: "dispute",
        description: "We need help resolving an account-related disagreement.",
      }),
    );
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect((await ownCasesGet(request("/api/cases"))).status).toBe(200);
    expect((await adminCasesGet(request("/api/admin/cases"))).status).toBe(403);
    state.userId = "bob";
    const own = await ownCasesGet(request("/api/cases"));
    expect(
      (await own.json()).some((item: { id: string }) => item.id === id),
    ).toBe(false);
    state.userId = "carol";
    const adminList = await adminCasesGet(
      request("/api/admin/cases?type=dispute"),
    );
    expect(adminList.status).toBe(200);
    expect(
      (await adminList.json()).some(
        (item: { case: { id: string } }) => item.case.id === id,
      ),
    ).toBe(true);
    const resolved = await caseReviewPatch(
      request(`/api/admin/cases/${id}`, "PATCH", {
        status: "resolved",
        reason: "Reviewed the account dispute and recorded the outcome.",
      }),
      context(id),
    );
    expect(resolved.status).toBe(200);
    expect(
      (
        await caseReviewPatch(
          request(`/api/admin/cases/${id}`, "PATCH", {
            status: "rejected",
            reason: "Trying a second decision.",
          }),
          context(id),
        )
      ).status,
    ).toBe(409);
    const [saved] = await db
      .select()
      .from(schema.moderationCase)
      .where(eq(schema.moderationCase.id, id));
    expect(saved.resolvedAt).not.toBeNull();
    const events = await db
      .select()
      .from(schema.audit)
      .where(eq(schema.audit.targetId, id));
    expect(events.map((event) => event.action)).toContain("CASE_RESOLVED");
  });
});
describe("HTTP API authorization and validation", () => {
  it("rejects signed-out private reads with 401", async () => {
    state.userId = null;
    expect((await profileGet(request("/api/users/me"))).status).toBe(401);
  });
  it("rejects cross-origin mutations", async () => {
    state.userId = "alice";
    expect(
      (
        await profilePatch(
          request("/api/users/me", "PATCH", {}, "https://attacker.example"),
        )
      ).status,
    ).toBe(403);
  });
  it("rejects ordinary users at the admin API with 403", async () => {
    state.userId = "alice";
    expect(
      (
        await adminPatch(
          request("/api/admin/users/bob", "PATCH", {
            status: "suspended",
            reason: "Attempt",
          }),
          context("bob"),
        )
      ).status,
    ).toBe(403);
  });
  it("cannot modify protected fields through the profile endpoint", async () => {
    state.userId = "alice";
    expect(
      (
        await profilePatch(
          request("/api/users/me", "PATCH", {
            name: "Alice",
            bio: "",
            preferredMode: "student",
            accessLevel: "administrator",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("switches mode without gaining admin privileges", async () => {
    state.userId = "alice";
    const result = await profilePatch(
      request("/api/users/me", "PATCH", {
        name: "Alice Student",
        bio: "My work",
        preferredMode: "employer",
      }),
    );
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body.preferredMode).toBe("employer");
    expect(body.accessLevel).toBe("user");
  });
  it("creates an owned portfolio and prevents another account from changing or deleting it", async () => {
    state.userId = "alice";
    const values = {
      title: "My project",
      description: "An example project for my portfolio",
      skills: ["Design"],
      projectUrl: "https://example.com",
      projectDate: "2026-10",
      visibility: "private",
      mediaId: null,
    };
    const created = await portfolioPost(
      request("/api/portfolio", "POST", values),
    );
    expect(created.status).toBe(201);
    const item = await created.json();
    expect(item.ownerId).toBe("alice");
    state.userId = "bob";
    expect(
      (
        await portfolioPatch(
          request(`/api/portfolio/${item.id}`, "PATCH", values),
          context(item.id),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await portfolioDelete(
          request(`/api/portfolio/${item.id}`, "DELETE"),
          context(item.id),
        )
      ).status,
    ).toBe(404);
  });
  it("requires explicit consent when submitting university ID", async () => {
    state.userId = "alice";
    expect(
      (
        await verificationPost(
          request("/api/verification/student-id", "POST", {
            university: "Test University",
            mediaId: "test",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("cannot revoke another member’s session", async () => {
    await db.insert(schema.session).values({
      id: "session-alice",
      userId: "alice",
      token: "private-test-token",
      expiresAt: new Date(Date.now() + 100000),
    });
    state.userId = "bob";
    expect(
      (
        await revokeSession(
          request("/api/sessions/session-alice", "DELETE"),
          context("session-alice"),
        )
      ).status,
    ).toBe(404);
    expect(
      await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.id, "session-alice")),
    ).toHaveLength(1);
  });
  it("rejects a suspended user even if the auth layer returns an existing session", async () => {
    await db
      .update(schema.user)
      .set({ status: "suspended" })
      .where(eq(schema.user.id, "bob"));
    state.userId = "bob";
    expect((await profileGet(request("/api/users/me"))).status).toBe(401);
  });
});

describe("Private media access and upload processing", () => {
  it("accepts PDF work samples but rejects PDF identity evidence", async () => {
    state.userId = "alice";
    const document = await PDFDocument.create();
    document.addPage([200, 200]);
    const bytes = await document.save();
    const form = new FormData();
    form.set("purpose", "portfolio");
    form.set(
      "file",
      new File([new Uint8Array(bytes)], "certificate.pdf", {
        type: "application/pdf",
      }),
    );
    const response = await mediaPost(
      new Request("http://localhost:3000/api/media", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: form,
      }),
    );
    expect(response.status).toBe(201);
    const [stored] = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, (await response.json()).id));
    expect(stored.mimeType).toBe("application/pdf");
    expect(stored.storageKey).toMatch(/\.pdf$/);
    form.set("purpose", "university_id");
    const rejected = await mediaPost(
      new Request("http://localhost:3000/api/media", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: form,
      }),
    );
    expect(rejected.status).toBe(415);
  });
  it("rejects HTML disguised as a JPEG", async () => {
    state.userId = "alice";
    const form = new FormData();
    form.set("purpose", "university_id");
    form.set(
      "file",
      new File(["<html>not an image</html>"], "fake.jpg", {
        type: "image/jpeg",
      }),
    );
    const response = await mediaPost(
      new Request("http://localhost:3000/api/media", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: form,
      }),
    );
    expect(response.status).toBe(415);
  });
  it("decodes and stores a valid image without its original filename", async () => {
    state.userId = "alice";
    const image = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("purpose", "university_id");
    form.set(
      "file",
      new File([new Uint8Array(image)], "sensitive-student-id.png", {
        type: "image/png",
      }),
    );
    const response = await mediaPost(
      new Request("http://localhost:3000/api/media", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
        body: form,
      }),
    );
    expect(response.status).toBe(201);
    const result = await response.json();
    const [file] = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, result.id));
    expect(file.mimeType).toBe("image/jpeg");
    expect(file.storageKey).not.toContain("sensitive-student");
    expect(file.checksum).toHaveLength(64);
    expect(
      (await mediaGet(request(`/api/media/${file.id}`), context(file.id)))
        .status,
    ).toBe(307);
    state.userId = null;
    expect(
      (await mediaGet(request(`/api/media/${file.id}`), context(file.id)))
        .status,
    ).toBe(404);
    const events = await db
      .select()
      .from(schema.audit)
      .where(eq(schema.audit.targetId, file.id));
    expect(events).toHaveLength(1);
  });
  it("serves public portfolio media but stops issuing public links after hiding the item", async () => {
    await db.insert(schema.media).values({
      id: "public-work",
      ownerId: "alice",
      purpose: "portfolio",
      storageKey: "portfolio/example",
      mimeType: "image/jpeg",
      sizeBytes: 100,
      checksum: "test",
    });
    await db.insert(schema.portfolio).values({
      id: "public-item",
      ownerId: "alice",
      title: "Public project",
      description: "A public work sample",
      mediaId: "public-work",
      visibility: "public",
    });
    state.userId = null;
    expect(
      (
        await mediaGet(
          request("/api/media/public-work"),
          context("public-work"),
        )
      ).status,
    ).toBe(307);
    await db
      .update(schema.portfolio)
      .set({ visibility: "private" })
      .where(eq(schema.portfolio.id, "public-item"));
    expect(
      (
        await mediaGet(
          request("/api/media/public-work"),
          context("public-work"),
        )
      ).status,
    ).toBe(404);
  });
});
