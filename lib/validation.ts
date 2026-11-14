import { z } from "zod";
const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Use a full https:// or http:// URL");
export const profileInput = z
  .object({
    name: z.string().trim().min(2).max(100),
    bio: z.string().trim().max(1000),
    preferredMode: z.enum(["student", "employer"]),
  })
  .strict();
export const portfolioInput = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(3000),
    skills: z.array(z.string().trim().min(1).max(30)).max(10),
    projectUrl: z.union([safeUrl, z.literal("")]).transform((x) => x || null),
    projectDate: z
      .union([z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), z.literal("")])
      .transform((x) => x || null),
    visibility: z.enum(["private", "public"]),
    mediaId: z.string().max(100).nullable(),
  })
  .strict();
export const verificationInput = z
  .object({
    consent: z.literal(true),
    university: z.string().trim().min(3).max(160),
    mediaId: z.string().min(1).max(100),
  })
  .strict();
export const reviewInput = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const statusInput = z
  .object({
    status: z.enum(["active", "suspended"]),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const caseInput = z
  .object({
    subjectUserId: z.string().min(1).max(100),
    type: z.enum(["report", "dispute"]),
    description: z.string().trim().min(20).max(3000),
  })
  .strict();
export const caseReviewInput = z
  .object({
    status: z.enum(["under_review", "resolved", "rejected"]),
    reason: z.string().trim().min(5).max(1000),
  })
  .strict();
export const reorderInput = z
  .object({
    ids: z
      .array(z.string().min(1).max(100))
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate item"),
  })
  .strict();

// Module 2 — job marketplace. Money inputs are whole taka; services convert to poisha.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Use a valid date",
  );
export const jobCategories = [
  "design",
  "development",
  "marketing",
  "writing",
  "video",
  "data",
] as const;
export const jobInput = z
  .object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(20).max(5000),
    category: z.enum(jobCategories),
    skills: z
      .array(z.string().trim().min(1).max(30))
      .min(1, "Add at least one required skill")
      .max(10)
      .refine(
        (skills) =>
          new Set(skills.map((s) => s.toLowerCase())).size === skills.length,
        "Duplicate skill",
      ),
    budgetTaka: z.number().int().min(100).max(500_000),
    deadline: isoDate,
    locationType: z.enum(["remote", "onsite", "hybrid"]),
    location: z
      .string()
      .trim()
      .max(160)
      .transform((x) => x || null),
  })
  .strict()
  .refine((value) => value.locationType === "remote" || !!value.location, {
    message: "Add a location for on-site or hybrid work",
    path: ["location"],
  });
export const applicationInput = z
  .object({
    message: z.string().trim().min(20).max(1500),
    proposedPriceTaka: z.number().int().min(50).max(500_000),
    deliveryDays: z.number().int().min(1).max(365),
    approach: z.string().trim().max(3000).default(""),
    suitability: z.string().trim().max(2000).default(""),
  })
  .strict();
export const applicationDecisionInput = z
  .object({ decision: z.enum(["shortlisted", "rejected"]) })
  .strict();
export const jobSearchInput = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.enum(jobCategories).optional().catch(undefined),
  sort: z
    .enum(["newest", "budget-high", "budget-low", "deadline"])
    .catch("newest"),
});
