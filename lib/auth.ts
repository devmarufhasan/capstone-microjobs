import "server-only";
import { after } from "next/server";
import { getDb } from "./db";
import { createAuth } from "./auth-core";
import { emailVerificationEnabled } from "./feature-flags";
export { emailVerificationEnabled } from "./feature-flags";

export function authConfigured() {
  return !!(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL
  );
}
export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!authConfigured()) throw new Error("Authentication is not configured");
  if (!instance)
    instance = createAuth(getDb(), {
      secret: process.env.BETTER_AUTH_SECRET!,
      baseURL: process.env.BETTER_AUTH_URL!,
      emailVerificationEnabled: emailVerificationEnabled(),
      sendMail: async (to, subject, url) => {
        if (!emailConfigured())
          throw new Error("Email delivery is not configured");
        // Keep response timing independent of delivery and retain the task on serverless.
        after(async () => {
          try {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.EMAIL_FROM,
                to: [to],
                subject,
                text: `${subject}\n\nOpen this link to continue:\n${url}\n\nIf you did not request this, ignore this email.`,
              }),
            });
            if (!response.ok)
              console.error("email_delivery_failed", {
                status: response.status,
              });
          } catch {
            console.error("email_delivery_failed");
          }
        });
      },
    });
  return instance;
}
