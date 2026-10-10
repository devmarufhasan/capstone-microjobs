import { randomBytes, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import ws from "ws";
import { user, account, session, audit } from "../lib/db/schema";

nextEnv.loadEnvConfig(process.cwd());
if (process.argv[2] !== "--confirm-reset") throw new Error("Pass --confirm-reset to reset the demo administrator and revoke its sessions.");
const origin = process.env.BETTER_AUTH_URL;
if (!origin || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || process.env.EMAIL_VERIFICATION_ENABLED !== "false") {
  throw new Error("Requires localhost configuration with email verification disabled.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const email = "demo.admin@microjobs.test";
const password = randomBytes(24).toString("base64url");
try {
  const db = drizzle(pool);
  const hash = await hashPassword(password);
  await db.transaction(async (tx) => {
    const [member] = await tx.select().from(user).where(eq(user.email, email)).for("update");
    if (!member || member.status !== "active" || member.accessLevel !== "administrator") throw new Error("An active demo administrator must already exist.");
    const updated = await tx.update(account).set({ password: hash, updatedAt: new Date() }).where(and(eq(account.userId, member.id), eq(account.providerId, "credential"))).returning({ password: account.password });
    if (updated.length !== 1 || !updated[0].password || !await verifyPassword({ hash: updated[0].password, password })) throw new Error("Credential verification failed.");
    await tx.delete(session).where(eq(session.userId, member.id));
    await tx.insert(audit).values({ id: randomUUID(), actorId: member.id, action: "ADMIN_PASSWORD_RESET", targetId: member.id, reason: "User explicitly authorized demo administrator password reset and revocation of all sessions." });
  });
  console.log(`Admin login: ${origin}/login?next=%2Fadmin`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("Password verified; previous sessions revoked.");
} finally {
  await pool.end();
}
