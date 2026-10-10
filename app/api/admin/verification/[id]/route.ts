import { getDb } from "@/lib/db";
import { json, parseBody, requireUser, route, sameOrigin } from "@/lib/http";
import { reviewStudent } from "@/lib/services";
import { reviewInput } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request, true);
    const { decision, reason } = await parseBody(request, reviewInput);
    await reviewStudent(getDb(), actor, (await params).id, decision, reason);
    return json({ success: true });
  });
}
