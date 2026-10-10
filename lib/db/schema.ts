import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  uniqueIndex,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const accessLevel = pgEnum("access_level", ["user", "administrator"]);
export const accountMode = pgEnum("account_mode", ["student", "employer"]);
export const accountStatus = pgEnum("account_status", ["active", "suspended"]);
export const reviewStatus = pgEnum("student_review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const visibility = pgEnum("portfolio_visibility", ["private", "public"]);
export const mediaPurpose = pgEnum("module_one_media_purpose", [
  "portfolio",
  "university_id",
]);
export const moderationCaseType = pgEnum("module_one_case_type", [
  "report",
  "dispute",
]);
export const moderationCaseStatus = pgEnum("module_one_case_status", [
  "open",
  "under_review",
  "resolved",
  "rejected",
]);

// Better Auth owns these four auth models; passwords live in account, not user.
export const user = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    accessLevel: accessLevel("access_level").default("user").notNull(),
    preferredMode: accountMode("preferred_mode").default("student").notNull(),
    status: accountStatus("status").default("active").notNull(),
    bio: text("bio").default("").notNull(),
    ...dates(),
  },
  (t) => [
    index("users_status_idx").on(t.status),
    index("users_access_idx").on(t.accessLevel),
    uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
  ],
);
export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ...dates(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
export const account = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...dates(),
  },
  (t) => [
    index("accounts_user_idx").on(t.userId),
    uniqueIndex("accounts_provider_idx").on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...dates(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const rateLimit = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const media = pgTable(
  "media_files",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    purpose: mediaPurpose("purpose").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: text("checksum").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("media_owner_idx").on(t.ownerId)],
);
export const portfolio = pgTable(
  "portfolio_items",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    skills: text("skills").array().default([]).notNull(),
    projectUrl: text("project_url"),
    projectDate: text("project_date"),
    visibility: visibility("visibility").default("private").notNull(),
    position: integer("position").default(0).notNull(),
    mediaId: text("media_id").references(() => media.id, {
      onDelete: "restrict",
    }),
    ...dates(),
  },
  (t) => [index("portfolio_owner_idx").on(t.ownerId, t.position)],
);
export const studentVerification = pgTable(
  "student_verifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    university: text("university").notNull(),
    consentVersion: text("consent_version").default("student-id-v1").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    status: reviewStatus("status").default("pending").notNull(),
    reviewerId: text("reviewer_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    reason: text("reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...dates(),
  },
  (t) => [
    index("student_review_queue_idx").on(t.status, t.createdAt),
    uniqueIndex("student_current_verification_idx")
      .on(t.userId)
      .where(sql`${t.status} in ('pending', 'approved')`),
  ],
);
export const audit = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
// Module 1 owns user/account cases. Job and participation links belong to the
// marketplace schema and can be added when those records exist.
export const moderationCase = pgTable(
  "moderation_cases",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    subjectUserId: text("subject_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    type: moderationCaseType("type").notNull(),
    status: moderationCaseStatus("status").default("open").notNull(),
    description: text("description").notNull(),
    assignedAdminId: text("assigned_admin_user_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...dates(),
  },
  (t) => [
    index("cases_reporter_created_idx").on(t.reporterId, t.createdAt),
    index("cases_status_created_idx").on(t.status, t.createdAt),
    index("cases_subject_created_idx").on(t.subjectUserId, t.createdAt),
    check("cases_distinct_parties", sql`${t.reporterId} <> ${t.subjectUserId}`),
    check("cases_nonempty_description", sql`length(trim(${t.description})) > 0`),
  ],
);
export type User = typeof user.$inferSelect;
