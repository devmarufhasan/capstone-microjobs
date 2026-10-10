import nextEnv from "@next/env";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import { user, audit, session } from "../lib/db/schema";
import { emailVerificationEnabled } from "../lib/feature-flags";
nextEnv.loadEnvConfig(process.cwd());
neonConfig.webSocketConstructor = ws;
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.DATABASE_URL)
  throw new Error(
    "Usage: npm run admin:promote -- verified-email@example.com (requires DATABASE_URL)",
  );
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const db = drizzle(pool);
  await db.transaction(async (tx) => {
    const [member] = await tx
      .select()
      .from(user)
      .where(eq(user.email, email!))
      .for("update");
    if (!member || member.status !== "active" || (emailVerificationEnabled() && !member.emailVerified))
      throw new Error("Register an active account, and verify its email if email verification is enabled.");
    if (member.accessLevel === "administrator") {
      console.log("Account is already an administrator.");
      return;
    }
    await tx
      .update(user)
      .set({ accessLevel: "administrator", updatedAt: new Date() })
      .where(eq(user.id, member.id));
    await tx.delete(session).where(eq(session.userId, member.id));
    await tx.insert(audit).values({
      id: crypto.randomUUID(),
      actorId: member.id,
      action: "ADMIN_BOOTSTRAPPED",
      targetId: member.id,
      reason: "Controlled operator CLI promotion; sessions revoked",
    });
    console.log("Administrator promoted. Sign in again to use admin tools.");
  });
} finally {
  await pool.end();
}
