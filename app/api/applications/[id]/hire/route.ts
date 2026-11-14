import { getDb } from "@/lib/db";
import { json, requireMember, route, sameOrigin } from "@/lib/http";
import { hireApplication } from "@/lib/marketplace";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    return json(await hireApplication(getDb(), actor, id));
  });
}
