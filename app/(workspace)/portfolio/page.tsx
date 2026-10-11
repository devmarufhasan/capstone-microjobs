import { asc, eq } from "drizzle-orm";
import { PortfolioManager } from "@/components/portfolio-manager";
import { pageUser } from "@/lib/http";
import { getDb } from "@/lib/db";
import { media, portfolio } from "@/lib/db/schema";
import { storageConfigured } from "@/lib/storage";
export const metadata = { title: "My portfolio" };
export default async function Page() {
  const actor = await pageUser();
  const items = await getDb()
    .select({ item: portfolio, mediaMimeType: media.mimeType })
    .from(portfolio)
    .leftJoin(media, eq(media.id, portfolio.mediaId))
    .where(eq(portfolio.ownerId, actor.id))
    .orderBy(asc(portfolio.position), asc(portfolio.createdAt));
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Made by you</p>
        <h1>My portfolio</h1>
        <p className="muted">
          Give your work a home. Choose what you want the world to see.
        </p>
      </div>
      <PortfolioManager
        items={items.map(
          ({
            item: {
              id,
              title,
              description,
              skills,
              projectUrl,
              projectDate,
              visibility,
              mediaId,
            },
            mediaMimeType,
          }) => ({
            id,
            title,
            description,
            skills,
            projectUrl,
            projectDate,
            visibility,
            mediaId,
            mediaMimeType,
          }),
        )}
        userId={actor.id}
        storage={storageConfigured()}
      />
    </>
  );
}
