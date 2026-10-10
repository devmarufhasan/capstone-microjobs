import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { moderationCase, user } from "@/lib/db/schema";
import { json, parseBody, requireUser, route, sameOrigin } from "@/lib/http";
import { submitCase } from "@/lib/services";
import { caseInput } from "@/lib/validation";

export async function GET(request: Request) {
  return route(async () => {
    const actor = await requireUser(request);
    const cases = await getDb()
      .select({
        id: moderationCase.id,
        type: moderationCase.type,
        status: moderationCase.status,
        description: moderationCase.description,
        resolution: moderationCase.resolution,
        subjectName: user.name,
        createdAt: moderationCase.createdAt,
        resolvedAt: moderationCase.resolvedAt,
      })
      .from(moderationCase)
      .innerJoin(user, eq(user.id, moderationCase.subjectUserId))
      .where(eq(moderationCase.reporterId, actor.id))
      .orderBy(desc(moderationCase.createdAt))
      .limit(100);
    return json(cases);
  });
}

export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const input = await parseBody(request, caseInput);
    const created = await submitCase(getDb(), actor, input);
    return json({ id: created.id, status: created.status }, 201);
  });
}
