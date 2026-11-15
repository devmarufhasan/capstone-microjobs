import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

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
import { GET as jobsGet, POST as jobsPost } from "../app/api/jobs/route";
import {
  GET as jobGet,
  PATCH as jobPatch,
  DELETE as jobDelete,
} from "../app/api/jobs/[id]/route";
import {
  GET as jobApplicationsGet,
  POST as applyPost,
} from "../app/api/jobs/[id]/applications/route";
import { GET as myApplicationsGet } from "../app/api/applications/route";
import {
  PATCH as applicationPatch,
  DELETE as applicationDelete,
} from "../app/api/applications/[id]/route";
import { POST as decisionPost } from "../app/api/applications/[id]/decision/route";
import { POST as hirePost } from "../app/api/applications/[id]/hire/route";

const postgres = new PGlite();
const db = drizzle(postgres, { schema });
state.db = db;
const as = (userId: string | null) => (state.userId = userId);
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
const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const jobBody = (overrides: Record<string, unknown> = {}) => ({
  title: "Design a poster for our book fair",
  description:
    "We need an A3 poster and one square social post for a campus book fair.",
  category: "design",
  skills: ["Poster design", "Canva"],
  budgetTaka: 1500,
  deadline: inDays(7),
  locationType: "remote",
  location: "",
  ...overrides,
});
const proposal = (overrides: Record<string, unknown> = {}) => ({
  message: "Hi! I design posters for my university clubs every semester.",
  proposedPriceTaka: 1200,
  deliveryDays: 3,
  approach: "Two concepts on day one, then refine the chosen one.",
  suitability: "I have designed eight event posters this year.",
  ...overrides,
});

beforeAll(async () => {
  // MIGRATIONS_DIR lets the suite run against a freshly generated migration
  // before it is copied into ./drizzle by `npm run db:generate`.
  const dir = process.env.MIGRATIONS_DIR ?? "drizzle";
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await postgres.exec(readFileSync(`${dir}/${file}`, "utf8"));
  const people = [
    ["emma", "Emma Employer", "user", "employer"],
    ["sam", "Sam Student", "user", "student"],
    ["sara", "Sara Student", "user", "student"],
    ["tom", "Tom Student", "user", "student"],
    ["admin", "Ada Admin", "administrator", "student"],
  ] as const;
  await db.insert(schema.user).values(
    people.map(([id, name, accessLevel, preferredMode]) => ({
      id,
      name,
      email: `${id}@test.example`,
      emailVerified: true,
      accessLevel,
      preferredMode,
    })),
  );
  await db.insert(schema.media).values({
    id: "sam-id-card",
    ownerId: "sam",
    purpose: "university_id",
    storageKey: "local:sam-id",
    mimeType: "image/png",
    sizeBytes: 10,
    checksum: "x",
  });
  await db.insert(schema.studentVerification).values({
    id: "sam-verification",
    userId: "sam",
    university: "DIU",
    mediaId: "sam-id-card",
    status: "approved",
  });
}, 30000);
afterAll(async () => {
  await postgres.close();
});

let jobId = "";
let samApp = "";
let saraApp = "";
let tomApp = "";

describe("Module 2 · Post a Job", () => {
  it("requires sign-in, same origin and a member account", async () => {
    as(null);
    expect(
      (await jobsPost(request("/api/jobs", "POST", jobBody()))).status,
    ).toBe(401);
    as("emma");
    expect(
      (
        await jobsPost(
          request("/api/jobs", "POST", jobBody(), "https://evil.example"),
        )
      ).status,
    ).toBe(403);
    as("admin");
    expect(
      (await jobsPost(request("/api/jobs", "POST", jobBody()))).status,
    ).toBe(403);
  });
  it("validates title, skills, budget, deadline and location", async () => {
    as("emma");
    for (const bad of [
      { title: "Hi" },
      { skills: [] },
      { budgetTaka: 10 },
      { budgetTaka: 99.5 },
      { deadline: inDays(-1) },
      { locationType: "onsite", location: "" },
      { category: "cooking" },
      { status: "in_progress" },
    ]) {
      const response = await jobsPost(
        request("/api/jobs", "POST", jobBody(bad)),
      );
      expect(response.status, JSON.stringify(bad)).toBe(400);
    }
  });
  it("publishes a job with budget stored as integer poisha", async () => {
    as("emma");
    const response = await jobsPost(
      request(
        "/api/jobs",
        "POST",
        jobBody({ locationType: "hybrid", location: "Dhanmondi, Dhaka" }),
      ),
    );
    expect(response.status).toBe(201);
    const created = await response.json();
    jobId = created.id;
    expect(created).toMatchObject({
      employerId: "emma",
      status: "open",
      budgetPoisha: 150_000,
      location: "Dhanmondi, Dhaka",
    });
  });
  it("lets only the owner edit an open job", async () => {
    as("sam");
    expect(
      (
        await jobPatch(
          request(`/api/jobs/${jobId}`, "PATCH", jobBody()),
          context(jobId),
        )
      ).status,
    ).toBe(404);
    as("emma");
    const response = await jobPatch(
      request(`/api/jobs/${jobId}`, "PATCH", jobBody({ budgetTaka: 1800 })),
      context(jobId),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).budgetPoisha).toBe(180_000);
  });
});

describe("Module 2 · Browse and Apply for Jobs", () => {
  it("lists open jobs publicly with search, category and skill matching", async () => {
    as(null);
    const all = await (await jobsGet(request("/api/jobs"))).json();
    expect(all.map((row: { job: { id: string } }) => row.job.id)).toContain(
      jobId,
    );
    const bySkill = await (await jobsGet(request("/api/jobs?q=canva"))).json();
    expect(bySkill).toHaveLength(1);
    const otherCategory = await (
      await jobsGet(request("/api/jobs?category=writing"))
    ).json();
    expect(otherCategory).toHaveLength(0);
    const wildcard = await (await jobsGet(request("/api/jobs?q=%25"))).json();
    expect(wildcard).toHaveLength(0);
    const detail = await jobGet(request(`/api/jobs/${jobId}`), context(jobId));
    expect(detail.status).toBe(200);
  });
  it("blocks applying to your own job and validates proposal fields", async () => {
    as("emma");
    expect(
      (
        await applyPost(
          request(`/api/jobs/${jobId}/applications`, "POST", proposal()),
          context(jobId),
        )
      ).status,
    ).toBe(403);
    as("sam");
    for (const bad of [
      { message: "too short" },
      { proposedPriceTaka: 0 },
      { deliveryDays: 0 },
      { deliveryDays: 400 },
    ]) {
      const response = await applyPost(
        request(`/api/jobs/${jobId}/applications`, "POST", proposal(bad)),
        context(jobId),
      );
      expect(response.status, JSON.stringify(bad)).toBe(400);
    }
  });
  it("accepts one application per student per job", async () => {
    for (const [id, price] of [
      ["sam", 1200],
      ["sara", 1500],
      ["tom", 900],
    ] as const) {
      as(id);
      const response = await applyPost(
        request(
          `/api/jobs/${jobId}/applications`,
          "POST",
          proposal({ proposedPriceTaka: price }),
        ),
        context(jobId),
      );
      expect(response.status).toBe(201);
      const created = await response.json();
      expect(created.status).toBe("submitted");
      expect(created.proposedPricePoisha).toBe(price * 100);
      if (id === "sam") samApp = created.id;
      if (id === "sara") saraApp = created.id;
      if (id === "tom") tomApp = created.id;
    }
    as("sam");
    expect(
      (
        await applyPost(
          request(`/api/jobs/${jobId}/applications`, "POST", proposal()),
          context(jobId),
        )
      ).status,
    ).toBe(409);
  });
});

describe("Module 2 · Job Proposal System", () => {
  it("lets the student edit their own proposal only", async () => {
    as("sara");
    expect(
      (
        await applicationPatch(
          request(`/api/applications/${samApp}`, "PATCH", proposal()),
          context(samApp),
        )
      ).status,
    ).toBe(404);
    as("sam");
    const response = await applicationPatch(
      request(
        `/api/applications/${samApp}`,
        "PATCH",
        proposal({ deliveryDays: 2, approach: "Updated plan" }),
      ),
      context(samApp),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      deliveryDays: 2,
      approach: "Updated plan",
    });
  });
  it("supports withdraw and one resubmission", async () => {
    as("tom");
    expect(
      (
        await applicationDelete(
          request(`/api/applications/${tomApp}`, "DELETE"),
          context(tomApp),
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await applicationDelete(
          request(`/api/applications/${tomApp}`, "DELETE"),
          context(tomApp),
        )
      ).status,
    ).toBe(409);
    const again = await applyPost(
      request(
        `/api/jobs/${jobId}/applications`,
        "POST",
        proposal({ proposedPriceTaka: 950 }),
      ),
      context(jobId),
    );
    expect(again.status).toBe(201);
    expect(await again.json()).toMatchObject({
      id: tomApp,
      status: "submitted",
    });
  });
  it("shows the student their own applications", async () => {
    as("sam");
    const rows = await (
      await myApplicationsGet(request("/api/applications"))
    ).json();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      employerName: "Emma Employer",
      job: { id: jobId, status: "open" },
    });
  });
});

describe("Module 2 · Hire Students", () => {
  it("shows applicants with profile trust signals to the owner only", async () => {
    as("sam");
    expect(
      (
        await jobApplicationsGet(
          request(`/api/jobs/${jobId}/applications`),
          context(jobId),
        )
      ).status,
    ).toBe(404);
    as("emma");
    const data = await (
      await jobApplicationsGet(
        request(`/api/jobs/${jobId}/applications`),
        context(jobId),
      )
    ).json();
    expect(data.applications).toHaveLength(3);
    const sam = data.applications.find(
      (row: { student: { id: string } }) => row.student.id === "sam",
    );
    expect(sam.verifiedStudent).toBe(true);
    expect(sam.student).not.toHaveProperty("email");
  });
  it("shortlists and declines, but only for the owner", async () => {
    as("sara");
    expect(
      (
        await decisionPost(
          request(`/api/applications/${samApp}/decision`, "POST", {
            decision: "shortlisted",
          }),
          context(samApp),
        )
      ).status,
    ).toBe(404);
    as("emma");
    const shortlisted = await decisionPost(
      request(`/api/applications/${samApp}/decision`, "POST", {
        decision: "shortlisted",
      }),
      context(samApp),
    );
    expect(shortlisted.status).toBe(200);
    expect((await shortlisted.json()).status).toBe("shortlisted");
    const declined = await decisionPost(
      request(`/api/applications/${tomApp}/decision`, "POST", {
        decision: "rejected",
      }),
      context(tomApp),
    );
    expect((await declined.json()).status).toBe("rejected");
    // A declined proposal can no longer be edited by the student.
    as("tom");
    expect(
      (
        await applicationPatch(
          request(`/api/applications/${tomApp}`, "PATCH", proposal()),
          context(tomApp),
        )
      ).status,
    ).toBe(409);
  });
  it("hires exactly one student atomically and closes the job to others", async () => {
    as("emma");
    const [first, second] = await Promise.all([
      hirePost(
        request(`/api/applications/${samApp}/hire`, "POST"),
        context(samApp),
      ),
      hirePost(
        request(`/api/applications/${saraApp}/hire`, "POST"),
        context(saraApp),
      ),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const winner = first.status === 200 ? samApp : saraApp;
    const loser = winner === samApp ? saraApp : samApp;
    const [hiredJob] = await db
      .select()
      .from(schema.job)
      .where(eq(schema.job.id, jobId));
    expect(hiredJob).toMatchObject({
      status: "in_progress",
      hiredApplicationId: winner,
    });
    const [lost] = await db
      .select()
      .from(schema.jobApplication)
      .where(eq(schema.jobApplication.id, loser));
    expect(lost.status).toBe("rejected");
    const audits = await db
      .select()
      .from(schema.audit)
      .where(
        and(
          eq(schema.audit.action, "JOB_HIRED"),
          eq(schema.audit.targetId, winner),
        ),
      );
    expect(audits).toHaveLength(1);
    // The job is no longer listed, editable, or open to new proposals.
    as(null);
    const listed = await (await jobsGet(request("/api/jobs"))).json();
    expect(listed).toHaveLength(0);
    as("emma");
    expect(
      (
        await jobPatch(
          request(`/api/jobs/${jobId}`, "PATCH", jobBody()),
          context(jobId),
        )
      ).status,
    ).toBe(409);
    as(winner === samApp ? "sam" : "sara");
    expect(
      (
        await applicationDelete(
          request(`/api/applications/${winner}`, "DELETE"),
          context(winner),
        )
      ).status,
    ).toBe(409);
    // Participants can still open the job; outsiders cannot.
    expect(
      (await jobGet(request(`/api/jobs/${jobId}`), context(jobId))).status,
    ).toBe(200);
    as(null);
    expect(
      (await jobGet(request(`/api/jobs/${jobId}`), context(jobId))).status,
    ).toBe(404);
  });
  it("closing an open job declines pending applicants", async () => {
    as("emma");
    const created = await (
      await jobsPost(
        request("/api/jobs", "POST", jobBody({ title: "Enter survey data" })),
      )
    ).json();
    as("tom");
    const app = await (
      await applyPost(
        request(`/api/jobs/${created.id}/applications`, "POST", proposal()),
        context(created.id),
      )
    ).json();
    as("emma");
    expect(
      (
        await jobDelete(
          request(`/api/jobs/${created.id}`, "DELETE"),
          context(created.id),
        )
      ).status,
    ).toBe(204);
    const [closedApp] = await db
      .select()
      .from(schema.jobApplication)
      .where(eq(schema.jobApplication.id, app.id));
    expect(closedApp.status).toBe("rejected");
    as("sara");
    expect(
      (
        await applyPost(
          request(`/api/jobs/${created.id}/applications`, "POST", proposal()),
          context(created.id),
        )
      ).status,
    ).toBe(409);
    as("emma");
    const mine = await (await jobsGet(request("/api/jobs?mine=1"))).json();
    expect(
      mine.map((row: { job: { status: string } }) => row.job.status).sort(),
    ).toEqual(["cancelled", "in_progress"]);
  });
});
