import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { audit, media, portfolio, user } from "@/lib/db/schema";
import { currentUser, HttpError, route } from "@/lib/http";
import { isAdmin } from "@/lib/policy";
import { fileUrl, localFileResponse } from "@/lib/storage";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const [file] = await getDb()
      .select()
      .from(media)
      .where(eq(media.id, (await params).id));
    if (!file) throw new HttpError(404, "File not found.");
    const actor = await currentUser(request.headers);
    let allowed = !!actor && (actor.id === file.ownerId || isAdmin(actor));
    if (!allowed && file.purpose === "portfolio") {
      const published = await getDb()
        .select({ id: portfolio.id })
        .from(portfolio)
        .innerJoin(user, eq(user.id, portfolio.ownerId))
        .where(
          and(
            eq(portfolio.mediaId, file.id),
            eq(portfolio.visibility, "public"),
            eq(user.status, "active"),
          ),
        )
        .limit(1);
      allowed = published.length > 0;
    }
    if (!allowed) throw new HttpError(404, "File not found.");
    if (file.purpose === "university_id" && actor)
      await getDb().insert(audit).values({
        id: crypto.randomUUID(),
        actorId: actor.id,
        action: "STUDENT_EVIDENCE_VIEWED",
        targetId: file.id,
        reason: "Authorized private evidence access",
      });
    const local = await localFileResponse(file.storageKey, file.mimeType);
    if (local) return local;
    return new Response(null, {
      status: 307,
      headers: {
        Location: await fileUrl(file.storageKey, file.mimeType),
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  });
}
