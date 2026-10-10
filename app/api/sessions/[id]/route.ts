import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { HttpError, json, requireUser, route, sameOrigin } from "@/lib/http";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const deleted = await getDb()
      .delete(session)
      .where(
        and(eq(session.id, (await params).id), eq(session.userId, actor.id)),
      )
      .returning({ id: session.id });
    if (!deleted.length) throw new HttpError(404, "Session not found.");
    return json({ success: true });
  });
}
