import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { portfolio, user } from "@/lib/db/schema";
import {
  HttpError,
  json,
  parseBody,
  requireUser,
  route,
  sameOrigin,
} from "@/lib/http";
import { checkMedia } from "@/lib/services";
import { portfolioInput } from "@/lib/validation";
export async function GET(request: Request) {
  return route(async () => {
    const actor = await requireUser(request);
    return json(
      await getDb()
        .select()
        .from(portfolio)
        .where(eq(portfolio.ownerId, actor.id))
        .orderBy(asc(portfolio.position)),
    );
  });
}
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const values = await parseBody(request, portfolioInput);
    if (values.mediaId)
      await checkMedia(getDb(), values.mediaId, actor.id, "portfolio");
    const item = await getDb().transaction(async (tx) => {
      await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, actor.id))
        .for("update");
      const [total] = await tx
        .select({ value: count() })
        .from(portfolio)
        .where(eq(portfolio.ownerId, actor.id));
      if (total.value >= 100)
        throw new HttpError(400, "A portfolio can contain up to 100 items.");
      const [created] = await tx
        .insert(portfolio)
        .values({
          id: crypto.randomUUID(),
          ownerId: actor.id,
          ...values,
          position: total.value,
        })
        .returning();
      return created;
    });
    return json(item, 201);
  });
}
