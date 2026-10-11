import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { json, parseBody, requireMember, route, sameOrigin } from "@/lib/http";
import { profileInput } from "@/lib/validation";
export async function GET(request: Request) {
  return route(async () => json(await requireMember(request)));
}
export async function PATCH(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireMember(request);
    const values = await parseBody(request, profileInput);
    const [updated] = await getDb()
      .update(user)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(user.id, actor.id))
      .returning();
    return json(updated);
  });
}
