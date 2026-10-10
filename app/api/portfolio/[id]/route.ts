import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { audit, portfolio } from "@/lib/db/schema";
import { json, parseBody, requireUser, route, sameOrigin } from "@/lib/http";
import { checkMedia, ownedPortfolio } from "@/lib/services";
import { portfolioInput } from "@/lib/validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const { id } = await context.params;
    const original = await ownedPortfolio(getDb(), actor, id);
    const values = await parseBody(request, portfolioInput);
    if (values.mediaId)
      await checkMedia(getDb(), values.mediaId, original.ownerId, "portfolio");
    const item = await getDb().transaction(async (tx) => {
      const [updated] = await tx
        .update(portfolio)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(portfolio.id, id))
        .returning();
      if (original.ownerId !== actor.id)
        await tx.insert(audit).values({
          id: crypto.randomUUID(),
          actorId: actor.id,
          action: "PORTFOLIO_UPDATED",
          targetId: id,
          reason: "Administrator portfolio edit",
        });
      return updated;
    });
    return json(item);
  });
}
export async function DELETE(request: Request, context: Context) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    const { id } = await context.params;
    const item = await ownedPortfolio(getDb(), actor, id);
    await getDb().transaction(async (tx) => {
      await tx.delete(portfolio).where(eq(portfolio.id, id));
      if (item.ownerId !== actor.id)
        await tx.insert(audit).values({
          id: crypto.randomUUID(),
          actorId: actor.id,
          action: "PORTFOLIO_DELETED",
          targetId: id,
          reason: "Administrator portfolio removal",
        });
    });
    return new Response(null, { status: 204 });
  });
}
