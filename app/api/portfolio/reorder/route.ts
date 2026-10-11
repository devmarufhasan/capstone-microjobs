import { getDb } from "@/lib/db";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { reorderPortfolio } from "@/lib/services";
import { reorderInput } from "@/lib/validation";
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { ids } = await parseBody(request, reorderInput);
    await reorderPortfolio(getDb(), actor, ids);
    return json({ success: true });
  });
}
