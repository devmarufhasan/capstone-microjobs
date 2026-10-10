import { getDb } from "@/lib/db";
import { json, parseBody, requireUser, route, sameOrigin } from "@/lib/http";
import { changeStatus } from "@/lib/services";
import { statusInput } from "@/lib/validation";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request, true);
    const { status, reason } = await parseBody(request, statusInput);
    await changeStatus(getDb(), actor, (await params).id, status, reason);
    return json({ success: true });
  });
}
