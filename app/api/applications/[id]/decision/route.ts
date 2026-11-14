import { getDb } from "@/lib/db";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { decideApplication } from "@/lib/marketplace";
import { applicationDecisionInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    const { decision } = await parseBody(request, applicationDecisionInput);
    return json(await decideApplication(getDb(), actor, id, decision));
  });
}
