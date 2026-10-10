import { connection } from "next/server";
/* eslint-disable @next/next/no-img-element -- Public media is authorized by the application route. */
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { PublicHeader } from "@/components/brand";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { media, portfolio, studentVerification, user } from "@/lib/db/schema";
export const metadata = { title: "Student portfolio" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  if (!process.env.DATABASE_URL) notFound();
  const { id } = await params;
  const [owner] = await getDb()
    .select({ name: user.name, bio: user.bio })
    .from(user)
    .where(and(eq(user.id, id), eq(user.status, "active")));
  if (!owner) notFound();
  const [items, verified] = await Promise.all([
    getDb()
      .select({ item: portfolio, mediaMimeType: media.mimeType })
      .from(portfolio)
      .leftJoin(media, eq(media.id, portfolio.mediaId))
      .where(and(eq(portfolio.ownerId, id), eq(portfolio.visibility, "public")))
      .orderBy(asc(portfolio.position)),
    getDb()
      .select({ id: studentVerification.id })
      .from(studentVerification)
      .where(
        and(
          eq(studentVerification.userId, id),
          eq(studentVerification.status, "approved"),
        ),
      )
      .limit(1),
  ]);
  return (
    <>
      <PublicHeader marketplace />
      <main className="page public-portfolio">
        <section className="public-profile-header">
          <div className="public-profile-cover" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="public-profile-content">
            <span className="public-profile-avatar" aria-hidden="true">
              {owner.name.slice(0, 1).toUpperCase()}
            </span>
            <p className="eyebrow">A collection of work</p>
            <div className="row">
              <h1>{owner.name}</h1>
              {!!verified.length && (
                <span className="badge approved">✓ Verified Student</span>
              )}
            </div>
            <p className="muted">{owner.bio || "Welcome to my portfolio."}</p>
          </div>
        </section>
        <div className="row spread public-portfolio-heading">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2>Projects and experience</h2>
          </div>
          <span className="small muted">
            {items.length} public {items.length === 1 ? "project" : "projects"}
          </span>
        </div>
        {items.length ? (
          <div className="grid-two">
            {items.map(({ item, mediaMimeType }) => (
              <article className="panel portfolio-card" key={item.id}>
                {item.mediaId && mediaMimeType === "application/pdf" && (
                  <a href={`/api/media/${item.mediaId}`}>
                    Download PDF work sample ↗
                  </a>
                )}
                {item.mediaId && mediaMimeType !== "application/pdf" && (
                  <img
                    className="portfolio-image"
                    alt={item.title}
                    src={`/api/media/${item.mediaId}`}
                  />
                )}
                <h2>{item.title}</h2>
                <p className="muted">{item.description}</p>
                <div className="row">
                  {item.skills.map((skill) => (
                    <span key={skill} className="badge">
                      {skill}
                    </span>
                  ))}
                </div>
                {item.projectDate && (
                  <p className="small muted">{item.projectDate}</p>
                )}
                {item.projectUrl && (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View project ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className="panel empty">
            <h2>Good things are taking shape.</h2>
            <p className="muted">There are no public projects to show yet.</p>
          </section>
        )}
        <div className="public-profile-report">
          <Link
            href={`/cases?subject=${encodeURIComponent(id)}`}
            className="small muted"
          >
            Report or dispute this account ↗
          </Link>
        </div>
      </main>
    </>
  );
}
