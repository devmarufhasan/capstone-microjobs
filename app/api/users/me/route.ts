import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { json, parseBody, requireUser, route, sameOrigin } from "@/lib/http";
import { profileInput } from "@/lib/validation";
export async function GET(request: Request) {
  return route(async () => json(await requireUser(request)));
}
export async function PATCH(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const values = await parseBody(request, profileInput);
    const [updated] = await getDb()
      .update(user)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(user.id, actor.id))
      .returning();
    return json(updated);
  });
}
