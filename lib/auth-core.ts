import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getCurrentAdapter } from "@better-auth/core/context";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { z } from "zod";
import * as schema from "./db/schema";
import type { getDb } from "./db";

type Mail = (to: string, subject: string, url: string) => Promise<void>;
export function createAuth(
  db: ReturnType<typeof getDb>,
  options: {
    secret: string;
    baseURL: string;
    sendMail: Mail;
    rateLimit?: boolean;
    emailVerificationEnabled?: boolean;
  },
) {
  return betterAuth({
    appName: "MicroJobs",
    baseURL: options.baseURL,
    secret: options.secret,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: options.emailVerificationEnabled ?? true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) =>
        options.sendMail(user.email, "Reset your MicroJobs password", url),
    },
    emailVerification: {
      sendOnSignUp: options.emailVerificationEnabled ?? true,
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) =>
        options.sendMail(user.email, "Verify your MicroJobs email", url),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    verification: { storeIdentifier: "hashed" },
    user: {
      additionalFields: {
        accessLevel: {
          type: ["user", "administrator"],
          defaultValue: "user",
          input: false,
        },
        status: {
          type: ["active", "suspended"],
          defaultValue: "active",
          input: false,
        },
        preferredMode: {
          type: ["student", "employer"],
          defaultValue: "student",
          validator: { input: z.enum(["student", "employer"]) },
        },
        bio: { type: "string", defaultValue: "", input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (value) => {
            const name = z
              .string()
              .trim()
              .min(2)
              .max(100)
              .safeParse(value.name);
            if (!name.success)
              throw new APIError("BAD_REQUEST", {
                message: "Name must contain 2–100 characters.",
              });
            return {
              data: {
                ...value,
                name: name.data,
                email: value.email.trim().toLowerCase(),
                accessLevel: "user",
                status: "active",
                image: null,
              },
            };
          },
        },
        update: {
          before: async (value, context) => {
            if (value.preferredMode !== undefined) {
              const id = context?.context.session?.user.id;
              if (!id || !context)
                throw new APIError("FORBIDDEN", {
                  message: "An active member account is required.",
                });
              const adapter = await getCurrentAdapter(context.context.adapter);
              const actor = await adapter.findOne<{
                accessLevel: string;
                status: string;
              }>({
                model: "user",
                where: [{ field: "id", value: id }],
              });
              if (
                !actor ||
                actor.status !== "active" ||
                actor.accessLevel === "administrator"
              )
                throw new APIError("FORBIDDEN", {
                  message:
                    "Administrator accounts cannot switch workspace modes.",
                });
            }
            if (value.image)
              throw new APIError("BAD_REQUEST", {
                message: "Profile image updates are not supported yet.",
              });
            if (value.name !== undefined) {
              const name = z
                .string()
                .trim()
                .min(2)
                .max(100)
                .safeParse(value.name);
              if (!name.success)
                throw new APIError("BAD_REQUEST", {
                  message: "Name must contain 2–100 characters.",
                });
              return { data: { ...value, name: name.data } };
            }
          },
        },
      },
      session: {
        create: {
          before: async (value, context) => {
            // Sign-up creates its first session inside Better Auth's transaction.
            // Querying the outer Drizzle pool here waits on that uncommitted user.
            const adapter = await getCurrentAdapter(context!.context.adapter);
            const owner = await adapter.findOne<{ status: string }>({
              model: "user",
              where: [{ field: "id", value: value.userId }],
            });
            if (!owner || owner.status !== "active")
              throw new APIError("FORBIDDEN", {
                message: "This account is unavailable.",
              });
          },
        },
      },
    },
    rateLimit: {
      enabled: options.rateLimit ?? true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
  });
}
