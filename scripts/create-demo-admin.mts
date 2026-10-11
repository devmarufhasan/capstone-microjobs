import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import { createAuth } from "../lib/auth-core";
import * as schema from "../lib/db/schema";
import type { getDb } from "../lib/db";

nextEnv.loadEnvConfig(process.cwd());
neonConfig.webSocketConstructor = ws;

const origin = process.env.BETTER_AUTH_URL;
if (!origin || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
  throw new Error("Demo admin creation requires a localhost BETTER_AUTH_URL.");
}
if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
  throw new Error("DATABASE_URL and BETTER_AUTH_SECRET are required.");
}
if (process.env.EMAIL_VERIFICATION_ENABLED !== "false") {
  throw new Error("Demo admin creation requires EMAIL_VERIFICATION_ENABLED=false.");
}

const email = "demo.admin@microjobs.test";
const password = randomBytes(24).toString("base64url");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const db = drizzle(pool, { schema }) as ReturnType<typeof getDb>;
  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email));
  if (existing) throw new Error("Demo admin already exists. Refusing to rotate its password automatically.");

  const auth = createAuth(db, {
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: origin,
    emailVerificationEnabled: false,
    sendMail: async () => { throw new Error("Demo account does not send email."); },
  });
  const response = await auth.handler(new Request(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ name: "Demo Administrator", email, password }),
  }));
  if (!response.ok) throw new Error(`Demo registration failed (HTTP ${response.status}).`);

  await db.transaction(async (tx) => {
    const [member] = await tx.select().from(schema.user).where(eq(schema.user.email, email)).for("update");
    if (!member || member.status !== "active") throw new Error("Demo account was not created as an active user.");
    await tx.update(schema.user).set({ accessLevel: "administrator", updatedAt: new Date() }).where(eq(schema.user.id, member.id));
    await tx.delete(schema.session).where(eq(schema.session.userId, member.id));
    await tx.insert(schema.audit).values({
      id: crypto.randomUUID(),
      actorId: member.id,
      action: "ADMIN_BOOTSTRAPPED",
      targetId: member.id,
      reason: "Explicitly requested local demo administrator; sessions revoked",
    });
  });

  console.log(`Admin login: ${origin}/login?next=%2Fadmin`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
} finally {
  await pool.end();
}
