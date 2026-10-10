import { and, count, eq, gte, inArray } from "drizzle-orm";
import type { getDb } from "./db";
import {
  audit,
  media,
  moderationCase,
  portfolio,
  session,
  studentVerification,
  user,
  type User,
} from "./db/schema";
import { canEdit, canReview, isAdmin } from "./policy";
import { emailVerificationEnabled } from "./feature-flags";
// Typed domain errors stay independent of Next.js for real database tests.
export class DomainError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function submitCase(
  db: ReturnType<typeof getDb>,
  actor: User,
  input: {
    subjectUserId: string;
    type: "report" | "dispute";
    description: string;
  },
) {
  if (emailVerificationEnabled() && !actor.emailVerified)
    throw new DomainError(403, "Verify your email before submitting a case.");
  if (input.subjectUserId === actor.id)
    throw new DomainError(400, "You cannot submit a case about yourself.");
  return db.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, actor.id))
      .for("update");
    const [subject] = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, input.subjectUserId), eq(user.status, "active")));
    if (!subject) throw new DomainError(404, "Account not found.");
    const [recent] = await tx
      .select({ value: count() })
      .from(moderationCase)
      .where(
        and(
          eq(moderationCase.reporterId, actor.id),
          gte(moderationCase.createdAt, new Date(Date.now() - 86_400_000)),
        ),
      );
    if (recent.value >= 5)
      throw new DomainError(429, "You can submit up to five cases per day.");
    const [created] = await tx
      .insert(moderationCase)
      .values({
        id: crypto.randomUUID(),
        reporterId: actor.id,
        subjectUserId: input.subjectUserId,
        type: input.type,
        description: input.description,
      })
      .returning();
    return created;
  });
}
export async function reviewCase(
  db: ReturnType<typeof getDb>,
  actor: User,
  id: string,
  status: "under_review" | "resolved" | "rejected",
  reason: string,
) {
  if (!isAdmin(actor))
    throw new DomainError(403, "Administrator access required.");
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(moderationCase)
      .where(eq(moderationCase.id, id))
      .for("update");
    if (!item) throw new DomainError(404, "Case not found.");
    if (item.reporterId === actor.id || item.subjectUserId === actor.id)
      throw new DomainError(
        403,
        "An independent administrator must review this case.",
      );
    if (item.status === "resolved" || item.status === "rejected")
      throw new DomainError(409, "This case already has a final decision.");
    if (item.status === status)
      throw new DomainError(409, "This case already has that status.");
    const now = new Date();
    await tx
      .update(moderationCase)
      .set({
        status,
        assignedAdminId: actor.id,
        resolution: status === "under_review" ? null : reason,
        resolvedAt: status === "under_review" ? null : now,
        updatedAt: now,
      })
      .where(eq(moderationCase.id, id));
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: actor.id,
      action: `CASE_${status.toUpperCase()}`,
      targetId: id,
      reason,
    });
  });
}
export async function checkMedia(
  db: ReturnType<typeof getDb>,
  id: string,
  ownerId: string,
  purpose: "portfolio" | "university_id",
) {
  const [file] = await db
    .select()
    .from(media)
    .where(
      and(
        eq(media.id, id),
        eq(media.ownerId, ownerId),
        eq(media.purpose, purpose),
      ),
    );
  if (!file)
    throw new DomainError(
      400,
      "Choose an uploaded file belonging to this account.",
    );
  return file;
}
export async function changeStatus(
  db: ReturnType<typeof getDb>,
  actor: User,
  id: string,
  status: "active" | "suspended",
  reason: string,
) {
  if (!isAdmin(actor))
    throw new DomainError(403, "Administrator access required.");
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(user)
      .where(eq(user.id, id))
      .for("update");
    if (!target) throw new DomainError(404, "User not found.");
    if (target.id === actor.id || target.accessLevel === "administrator")
      throw new DomainError(
        403,
        "Administrator accounts cannot be moderated here.",
      );
    if (target.status === status) return;
    await tx
      .update(user)
      .set({ status, updatedAt: new Date() })
      .where(eq(user.id, id));
    if (status === "suspended")
      await tx.delete(session).where(eq(session.userId, id));
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: actor.id,
      action: status === "suspended" ? "USER_SUSPENDED" : "USER_RESTORED",
      targetId: id,
      reason,
    });
  });
}
export async function reviewStudent(
  db: ReturnType<typeof getDb>,
  actor: User,
  id: string,
  decision: "approved" | "rejected",
  reason: string,
) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(studentVerification)
      .where(eq(studentVerification.id, id))
      .for("update");
    if (!item) throw new DomainError(404, "Request not found.");
    if (!canReview(actor, item.userId))
      throw new DomainError(
        403,
        "An independent administrator must review this request.",
      );
    if (item.status !== "pending")
      throw new DomainError(409, "This request has already been reviewed.");
    await tx
      .update(studentVerification)
      .set({
        status: decision,
        reason,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentVerification.id, id));
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: actor.id,
      action: `STUDENT_${decision.toUpperCase()}`,
      targetId: id,
      reason,
    });
  });
}
export async function reorderPortfolio(
  db: ReturnType<typeof getDb>,
  actor: User,
  ids: string[],
) {
  await db.transaction(async (tx) => {
    // Serialize updates per owner, including concurrent reorder requests.
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, actor.id))
      .for("update");
    const items = await tx
      .select({ id: portfolio.id })
      .from(portfolio)
      .where(eq(portfolio.ownerId, actor.id));
    if (
      ids.length !== items.length ||
      new Set(ids).size !== ids.length ||
      items.some((item) => !ids.includes(item.id))
    )
      throw new DomainError(400, "Refresh your portfolio before reordering.");
    for (const [position, id] of ids.entries())
      await tx
        .update(portfolio)
        .set({ position })
        .where(and(eq(portfolio.id, id), eq(portfolio.ownerId, actor.id)));
  });
}
export async function ownedPortfolio(
  db: ReturnType<typeof getDb>,
  actor: User,
  id: string,
) {
  const [item] = await db.select().from(portfolio).where(eq(portfolio.id, id));
  if (!item || !canEdit(actor, item.ownerId))
    throw new DomainError(404, "Portfolio item not found.");
  return item;
}
export async function submitVerification(
  db: ReturnType<typeof getDb>,
  actor: User,
  input: { university: string; mediaId: string },
) {
  if (emailVerificationEnabled() && !actor.emailVerified)
    throw new DomainError(403, "Verify your email first.");
  await checkMedia(db, input.mediaId, actor.id, "university_id");
  return db.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, actor.id))
      .for("update");
    const existing = await tx
      .select({ id: studentVerification.id })
      .from(studentVerification)
      .where(
        and(
          eq(studentVerification.userId, actor.id),
          inArray(studentVerification.status, ["pending", "approved"]),
        ),
      );
    if (existing.length)
      throw new DomainError(
        409,
        "You already have a pending or approved request.",
      );
    const [created] = await tx
      .insert(studentVerification)
      .values({
        id: crypto.randomUUID(),
        userId: actor.id,
        university: input.university,
        mediaId: input.mediaId,
        consentVersion: "student-id-v1",
        consentedAt: new Date(),
      })
      .returning();
    return created;
  });
}
