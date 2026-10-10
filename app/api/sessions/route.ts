import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { json, requireUser, route } from "@/lib/http";
export async function GET(request: Request) {
  return route(async () => {
    const actor = await requireUser(request);
    return json(
      await getDb()
        .select({
          id: session.id,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })
        .from(session)
        .where(
          and(eq(session.userId, actor.id), gt(session.expiresAt, new Date())),
        )
        .orderBy(desc(session.createdAt)),
    );
  });
}
