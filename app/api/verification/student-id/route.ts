import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { studentVerification } from "@/lib/db/schema";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { submitVerification } from "@/lib/services";
import { verificationInput } from "@/lib/validation";
export async function GET(request: Request) {
  return route(async () => {
    const actor = await requireMember(request);
    return json(
      await getDb()
        .select()
        .from(studentVerification)
        .where(eq(studentVerification.userId, actor.id))
        .orderBy(desc(studentVerification.createdAt)),
    );
  });
}
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const input = await parseBody(request, verificationInput);
    return json(await submitVerification(getDb(), actor, input), 201);
  });
}
