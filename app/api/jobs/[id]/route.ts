import { getDb } from "@/lib/db";
import {
  HttpError,
  currentUser,
  json,
  parseBody,
  requireMember,
  route,
  sameOrigin,
} from "@/lib/http";
import { cancelJob, getJobForViewer, updateJob } from "@/lib/marketplace";
import { jobInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return route(async () => {
    const { id } = await context.params;
    const viewer = await currentUser(request.headers);
    const item = await getJobForViewer(getDb(), viewer, id);
    if (!item) throw new HttpError(404, "Job not found.");
    return json(item);
  });
}
export async function PATCH(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    const values = await parseBody(request, jobInput);
    return json(await updateJob(getDb(), actor, id, values));
  });
}
// Closing a job keeps its record (and applicants' history) as "cancelled".
export async function DELETE(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const { id } = await context.params;
    await cancelJob(getDb(), actor, id);
    return new Response(null, { status: 204 });
  });
}
