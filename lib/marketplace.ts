import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { z } from "zod";
import type { getDb } from "./db";
import {
  audit,
  job,
  jobApplication,
  portfolio,
  studentVerification,
  user,
  type User,
} from "./db/schema";
import { DomainError } from "./services";
import { emailVerificationEnabled } from "./feature-flags";
import type { applicationInput, jobInput, jobSearchInput } from "./validation";

// Module 2 business rules. Route handlers stay thin; everything that changes
// marketplace state runs here inside a transaction that locks the job row, so
// concurrent hire/apply/cancel requests are serialized per job.
type Db = ReturnType<typeof getDb>;
type JobValues = z.infer<typeof jobInput>;
type ApplicationValues = z.infer<typeof applicationInput>;
export type JobSearch = z.infer<typeof jobSearchInput>;

const ACTIVE_APPLICATION = ["submitted", "shortlisted"] as const;
export const MAX_OPEN_JOBS = 20;
export const MAX_DAILY_APPLICATIONS = 20;

export const toPoisha = (taka: number) => taka * 100;
export const toTaka = (poisha: number) => Math.round(poisha / 100);
/** Calendar date in UTC (YYYY-MM-DD); deadlines are whole days. */
export function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function requireTrustedAccount(actor: User) {
  if (actor.accessLevel === "administrator")
    throw new DomainError(
      403,
      "Administrator accounts cannot use student or employer features.",
    );
  if (emailVerificationEnabled() && !actor.emailVerified)
    throw new DomainError(
      403,
      "Verify your email before using the marketplace.",
    );
}

function jobColumns(values: JobValues) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    skills: values.skills,
    budgetPoisha: toPoisha(values.budgetTaka),
    deadline: values.deadline,
    locationType: values.locationType,
    location: values.locationType === "remote" ? null : values.location,
  };
}

function applicationColumns(values: ApplicationValues) {
  return {
    message: values.message,
    proposedPricePoisha: toPoisha(values.proposedPriceTaka),
    deliveryDays: values.deliveryDays,
    approach: values.approach,
    suitability: values.suitability,
  };
}

async function lockOwnedJob(tx: Db, actor: User, jobId: string) {
  const [item] = await tx
    .select()
    .from(job)
    .where(eq(job.id, jobId))
    .for("update");
  // Hide other employers' jobs behind 404 instead of revealing existence.
  if (!item || item.employerId !== actor.id)
    throw new DomainError(404, "Job not found.");
  return item;
}

// ---------------------------------------------------------------- Post a Job
export async function createJob(db: Db, actor: User, values: JobValues) {
  requireTrustedAccount(actor);
  if (values.deadline < today())
    throw new DomainError(400, "The deadline must be today or later.");
  return db.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, actor.id))
      .for("update");
    const [open] = await tx
      .select({ value: count() })
      .from(job)
      .where(and(eq(job.employerId, actor.id), eq(job.status, "open")));
    if (open.value >= MAX_OPEN_JOBS)
      throw new DomainError(
        429,
        `You can have up to ${MAX_OPEN_JOBS} open jobs at a time.`,
      );
    const [created] = await tx
      .insert(job)
      .values({
        id: crypto.randomUUID(),
        employerId: actor.id,
        ...jobColumns(values),
      })
      .returning();
    return created;
  });
}

export async function updateJob(
  db: Db,
  actor: User,
  jobId: string,
  values: JobValues,
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const item = await lockOwnedJob(tx as unknown as Db, actor, jobId);
    if (item.status !== "open")
      throw new DomainError(409, "Only open jobs can be edited.");
    if (values.deadline < today() && values.deadline !== item.deadline)
      throw new DomainError(400, "The deadline must be today or later.");
    const [updated] = await tx
      .update(job)
      .set({ ...jobColumns(values), updatedAt: new Date() })
      .where(eq(job.id, jobId))
      .returning();
    return updated;
  });
}

export async function cancelJob(db: Db, actor: User, jobId: string) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const item = await lockOwnedJob(tx as unknown as Db, actor, jobId);
    if (item.status !== "open")
      throw new DomainError(409, "Only open jobs can be closed.");
    const now = new Date();
    await tx
      .update(job)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(job.id, jobId));
    // Applicants are told the job closed rather than left waiting.
    await tx
      .update(jobApplication)
      .set({ status: "rejected", decidedAt: now, updatedAt: now })
      .where(
        and(
          eq(jobApplication.jobId, jobId),
          inArray(jobApplication.status, [...ACTIVE_APPLICATION]),
        ),
      );
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: actor.id,
      action: "JOB_CANCELLED",
      targetId: jobId,
      reason: "Employer closed the job before hiring",
    });
  });
}

// ------------------------------------------------------- Browse and search
export async function searchOpenJobs(db: Db, search: JobSearch, limit = 60) {
  const filters: SQL[] = [eq(job.status, "open"), gte(job.deadline, today())];
  if (search.category) filters.push(eq(job.category, search.category));
  const term = search.q.replace(/[\\%_]/g, (c) => `\\${c}`);
  if (term)
    filters.push(
      or(
        ilike(job.title, `%${term}%`),
        ilike(job.description, `%${term}%`),
        ilike(sql`array_to_string(${job.skills}, ' ')`, `%${term}%`),
      )!,
    );
  const order =
    search.sort === "budget-high"
      ? [desc(job.budgetPoisha), desc(job.createdAt)]
      : search.sort === "budget-low"
        ? [asc(job.budgetPoisha), desc(job.createdAt)]
        : search.sort === "deadline"
          ? [asc(job.deadline), desc(job.createdAt)]
          : [desc(job.createdAt)];
  const rows = await db
    .select({
      job,
      employerName: user.name,
      applications: sql<number>`(select count(*)::int from ${jobApplication} where ${jobApplication.jobId} = ${job.id} and ${jobApplication.status} <> 'withdrawn')`,
    })
    .from(job)
    .innerJoin(user, eq(user.id, job.employerId))
    .where(and(...filters, eq(user.status, "active")))
    .orderBy(...order)
    .limit(limit);
  return rows;
}

/** Public detail: open jobs for everyone; other states only for participants. */
export async function getJobForViewer(
  db: Db,
  viewer: User | null,
  jobId: string,
) {
  const [row] = await db
    .select({ job, employerName: user.name, employerStatus: user.status })
    .from(job)
    .innerJoin(user, eq(user.id, job.employerId))
    .where(eq(job.id, jobId));
  if (!row) return null;
  const isOwner = viewer?.id === row.job.employerId;
  let ownApplication = null;
  if (viewer && !isOwner)
    [ownApplication] = await db
      .select()
      .from(jobApplication)
      .where(
        and(
          eq(jobApplication.jobId, jobId),
          eq(jobApplication.studentId, viewer.id),
        ),
      );
  const publiclyVisible =
    row.job.status === "open" && row.employerStatus === "active";
  if (!publiclyVisible && !isOwner && !ownApplication) return null;
  return { ...row, isOwner, ownApplication: ownApplication ?? null };
}

// ----------------------------------------------------- Apply / proposals
export async function applyToJob(
  db: Db,
  actor: User,
  jobId: string,
  values: ApplicationValues,
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(job)
      .where(eq(job.id, jobId))
      .for("update");
    if (!item) throw new DomainError(404, "Job not found.");
    if (item.employerId === actor.id)
      throw new DomainError(403, "You cannot apply to your own job.");
    if (item.status !== "open")
      throw new DomainError(
        409,
        "This job is no longer accepting applications.",
      );
    if (item.deadline < today())
      throw new DomainError(409, "The deadline for this job has passed.");
    const [recent] = await tx
      .select({ value: count() })
      .from(jobApplication)
      .where(
        and(
          eq(jobApplication.studentId, actor.id),
          gte(jobApplication.createdAt, new Date(Date.now() - 86_400_000)),
        ),
      );
    if (recent.value >= MAX_DAILY_APPLICATIONS)
      throw new DomainError(
        429,
        `You can send up to ${MAX_DAILY_APPLICATIONS} applications per day.`,
      );
    const [existing] = await tx
      .select()
      .from(jobApplication)
      .where(
        and(
          eq(jobApplication.jobId, jobId),
          eq(jobApplication.studentId, actor.id),
        ),
      );
    if (existing && existing.status !== "withdrawn")
      throw new DomainError(409, "You have already applied to this job.");
    if (existing) {
      // A withdrawn proposal may be resubmitted once more while the job is open.
      const [resubmitted] = await tx
        .update(jobApplication)
        .set({
          ...applicationColumns(values),
          status: "submitted",
          decidedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(jobApplication.id, existing.id))
        .returning();
      return resubmitted;
    }
    const [created] = await tx
      .insert(jobApplication)
      .values({
        id: crypto.randomUUID(),
        jobId,
        studentId: actor.id,
        ...applicationColumns(values),
      })
      .returning();
    return created;
  });
}

async function lockOwnApplication(tx: Db, actor: User, applicationId: string) {
  const [application] = await tx
    .select()
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId));
  if (!application || application.studentId !== actor.id)
    throw new DomainError(404, "Application not found.");
  const [item] = await tx
    .select()
    .from(job)
    .where(eq(job.id, application.jobId))
    .for("update");
  const [current] = await tx
    .select()
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId));
  return { job: item, application: current };
}

export async function updateApplication(
  db: Db,
  actor: User,
  applicationId: string,
  values: ApplicationValues,
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const locked = await lockOwnApplication(
      tx as unknown as Db,
      actor,
      applicationId,
    );
    if (locked.job.status !== "open")
      throw new DomainError(409, "This job is no longer accepting changes.");
    if (!ACTIVE_APPLICATION.includes(locked.application.status as never))
      throw new DomainError(409, "Only active proposals can be edited.");
    const [updated] = await tx
      .update(jobApplication)
      .set({ ...applicationColumns(values), updatedAt: new Date() })
      .where(eq(jobApplication.id, applicationId))
      .returning();
    return updated;
  });
}

export async function withdrawApplication(
  db: Db,
  actor: User,
  applicationId: string,
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const locked = await lockOwnApplication(
      tx as unknown as Db,
      actor,
      applicationId,
    );
    if (!ACTIVE_APPLICATION.includes(locked.application.status as never))
      throw new DomainError(409, "Only active proposals can be withdrawn.");
    await tx
      .update(jobApplication)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(jobApplication.id, applicationId));
  });
}

// --------------------------------------------- Review and hire (employer)
async function lockApplicationForEmployer(
  tx: Db,
  actor: User,
  applicationId: string,
) {
  const [application] = await tx
    .select({ jobId: jobApplication.jobId })
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId));
  if (!application) throw new DomainError(404, "Application not found.");
  const item = await lockOwnedJob(tx, actor, application.jobId).catch(() => {
    throw new DomainError(404, "Application not found.");
  });
  const [current] = await tx
    .select()
    .from(jobApplication)
    .where(eq(jobApplication.id, applicationId));
  return { job: item, application: current };
}

export async function decideApplication(
  db: Db,
  actor: User,
  applicationId: string,
  decision: "shortlisted" | "rejected",
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const locked = await lockApplicationForEmployer(
      tx as unknown as Db,
      actor,
      applicationId,
    );
    if (locked.job.status !== "open")
      throw new DomainError(
        409,
        "Applications can only be reviewed on open jobs.",
      );
    if (!ACTIVE_APPLICATION.includes(locked.application.status as never))
      throw new DomainError(409, "This application can no longer be reviewed.");
    if (locked.application.status === decision)
      throw new DomainError(409, "This application already has that status.");
    const now = new Date();
    const [updated] = await tx
      .update(jobApplication)
      .set({ status: decision, decidedAt: now, updatedAt: now })
      .where(eq(jobApplication.id, applicationId))
      .returning();
    return updated;
  });
}

export async function hireApplication(
  db: Db,
  actor: User,
  applicationId: string,
) {
  requireTrustedAccount(actor);
  return db.transaction(async (tx) => {
    const locked = await lockApplicationForEmployer(
      tx as unknown as Db,
      actor,
      applicationId,
    );
    if (locked.job.status !== "open")
      throw new DomainError(
        409,
        "A student has already been hired or the job is closed.",
      );
    if (!ACTIVE_APPLICATION.includes(locked.application.status as never))
      throw new DomainError(409, "Only active applications can be hired.");
    const [student] = await tx
      .select({ status: user.status })
      .from(user)
      .where(eq(user.id, locked.application.studentId));
    if (student?.status !== "active")
      throw new DomainError(409, "This student account is not active.");
    const now = new Date();
    await tx
      .update(jobApplication)
      .set({ status: "hired", decidedAt: now, updatedAt: now })
      .where(eq(jobApplication.id, applicationId));
    await tx
      .update(jobApplication)
      .set({ status: "rejected", decidedAt: now, updatedAt: now })
      .where(
        and(
          eq(jobApplication.jobId, locked.job.id),
          ne(jobApplication.id, applicationId),
          inArray(jobApplication.status, [...ACTIVE_APPLICATION]),
        ),
      );
    const [hiredJob] = await tx
      .update(job)
      .set({
        status: "in_progress",
        hiredApplicationId: applicationId,
        hiredAt: now,
        updatedAt: now,
      })
      .where(eq(job.id, locked.job.id))
      .returning();
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: actor.id,
      action: "JOB_HIRED",
      targetId: applicationId,
      reason: `Hired for job ${locked.job.id}`,
    });
    return hiredJob;
  });
}

// ------------------------------------------------------------ Read models
export async function listEmployerJobs(db: Db, actor: User) {
  return db
    .select({
      job,
      applications: sql<number>`(select count(*)::int from ${jobApplication} where ${jobApplication.jobId} = ${job.id} and ${jobApplication.status} <> 'withdrawn')`,
    })
    .from(job)
    .where(eq(job.employerId, actor.id))
    .orderBy(desc(job.createdAt));
}

/** Applicants with the trust signals an employer needs to choose. Owner only. */
export async function listJobApplications(db: Db, actor: User, jobId: string) {
  const [item] = await db.select().from(job).where(eq(job.id, jobId));
  if (!item || item.employerId !== actor.id)
    throw new DomainError(404, "Job not found.");
  const rows = await db
    .select({
      application: jobApplication,
      student: {
        id: user.id,
        name: user.name,
        bio: user.bio,
        image: user.image,
      },
      verifiedStudent: sql<boolean>`exists (select 1 from ${studentVerification} where ${studentVerification.userId} = ${user.id} and ${studentVerification.status} = 'approved')`,
      publicPortfolioItems: sql<number>`(select count(*)::int from ${portfolio} where ${portfolio.ownerId} = ${user.id} and ${portfolio.visibility} = 'public')`,
    })
    .from(jobApplication)
    .innerJoin(user, eq(user.id, jobApplication.studentId))
    .where(
      and(
        eq(jobApplication.jobId, jobId),
        ne(jobApplication.status, "withdrawn"),
      ),
    )
    .orderBy(
      sql`case ${jobApplication.status} when 'hired' then 0 when 'shortlisted' then 1 when 'submitted' then 2 else 3 end`,
      asc(jobApplication.createdAt),
    );
  return { job: item, applications: rows };
}

export async function listStudentApplications(db: Db, actor: User) {
  return db
    .select({
      application: jobApplication,
      job: {
        id: job.id,
        title: job.title,
        status: job.status,
        budgetPoisha: job.budgetPoisha,
        deadline: job.deadline,
        category: job.category,
      },
      employerName: user.name,
    })
    .from(jobApplication)
    .innerJoin(job, eq(job.id, jobApplication.jobId))
    .innerJoin(user, eq(user.id, job.employerId))
    .where(eq(jobApplication.studentId, actor.id))
    .orderBy(desc(jobApplication.updatedAt));
}
