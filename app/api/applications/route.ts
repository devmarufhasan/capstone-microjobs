import { getDb } from "@/lib/db";
import { json, requireMember, route } from "@/lib/http";
import { listStudentApplications } from "@/lib/marketplace";
export async function GET(request: Request) {
  return route(async () => {
    const actor = await requireMember(request);
    return json(await listStudentApplications(getDb(), actor));
  });
}
