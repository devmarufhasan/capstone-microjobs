import { getDb } from "@/lib/db";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { updateApplication, withdrawApplication } from "@/lib/marketplace";
import { applicationInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    const values = await parseBody(request, applicationInput);
    return json(await updateApplication(getDb(), actor, id, values));
  });
}
export async function DELETE(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    await withdrawApplication(getDb(), actor, id);
    return new Response(null, { status: 204 });
  });
}
