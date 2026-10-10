import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { AdminAction } from "@/components/admin-action";
import { getDb } from "@/lib/db";
import { studentVerification, user } from "@/lib/db/schema";
import { pageUser } from "@/lib/http";
import { ClipboardCheck } from "lucide-react";
export const metadata = { title: "Review student IDs" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const actor = await pageUser(true);
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1") || 1);
  const requests = await getDb()
    .select({
      id: studentVerification.id,
      userId: studentVerification.userId,
      name: user.name,
      university: studentVerification.university,
      mediaId: studentVerification.mediaId,
      createdAt: studentVerification.createdAt,
    })
    .from(studentVerification)
    .innerJoin(user, eq(user.id, studentVerification.userId))
    .where(eq(studentVerification.status, "pending"))
    .orderBy(asc(studentVerification.createdAt))
    .limit(21)
    .offset((page - 1) * 20);
  return (
    <>
      <div className="page-heading">
        <h1>Student verification</h1>
        <p className="muted">
          Review the university ID against the applicant’s name and institution.
        </p>
      </div>
      <div className="stack">
        {requests.slice(0, 20).map((item) => (
          <section className="panel" key={item.id}>
            <div className="row spread">
              <div>
                <h2>{item.name}</h2>
                <p className="muted small">
                  {item.university} ·{" "}
                  {item.createdAt.toLocaleDateString("en-GB", {
                    timeZone: "Asia/Dhaka",
                  })}
                </p>
              </div>
              <a
                className="link-button secondary"
                href={`/api/media/${item.mediaId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View private evidence ↗
              </a>
            </div>
            <div style={{ marginTop: 20 }}>
              {item.userId === actor.id ? (
                <p className="muted">
                  Another administrator must review your submission.
                </p>
              ) : (
                <AdminAction kind="verification" id={item.id} />
              )}
            </div>
          </section>
        ))}
        {!requests.length && (
          <section className="panel empty">
            <ClipboardCheck size={42} aria-hidden="true" />
            <h2>All caught up.</h2>
            <p className="muted">No pending student IDs on this page.</p>
          </section>
        )}
        <div className="row spread">
          {page > 1 && (
            <Link href={`/admin/verification?page=${page - 1}`}>
              ← Previous
            </Link>
          )}
          {requests.length > 20 && (
            <Link href={`/admin/verification?page=${page + 1}`}>Next →</Link>
          )}
        </div>
      </div>
    </>
  );
}
