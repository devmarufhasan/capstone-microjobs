import { getDb } from "@/lib/db";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { createJob, listEmployerJobs, searchOpenJobs } from "@/lib/marketplace";
import { jobInput, jobSearchInput } from "@/lib/validation";

// GET /api/jobs?q=&category=&sort=  — public search of open jobs.
// GET /api/jobs?mine=1              — the signed-in employer's own jobs.
export async function GET(request: Request) {
  return route(async () => {
    const params = new URL(request.url).searchParams;
    if (params.get("mine")) {
      const actor = await requireMember(request);
      return json(await listEmployerJobs(getDb(), actor));
    }
    const search = jobSearchInput.parse(Object.fromEntries(params));
    return json(await searchOpenJobs(getDb(), search));
  });
}
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const values = await parseBody(request, jobInput);
    return json(await createJob(getDb(), actor, values), 201);
  });
}
