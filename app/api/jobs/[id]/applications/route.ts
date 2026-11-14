import { getDb } from "@/lib/db";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { applyToJob, listJobApplications } from "@/lib/marketplace";
import { applicationInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
// Employer (job owner) reviews applicants.
export async function GET(request: Request, context: Context) {
  return route(async () => {
    const actor = await requireMember(request);
    const { id } = await context.params;
    return json(await listJobApplications(getDb(), actor, id));
  });
}
// Student applies with a message, price, delivery time and optional proposal.
export async function POST(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    const values = await parseBody(request, applicationInput);
    return json(await applyToJob(getDb(), actor, id, values), 201);
  });
}
