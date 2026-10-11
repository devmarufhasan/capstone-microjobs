import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { CaseForm } from "@/components/case-form";
import { getDb } from "@/lib/db";
import { moderationCase, user } from "@/lib/db/schema";
import { pageMember } from "@/lib/http";
import { FileCheck2, Flag } from "lucide-react";

export const metadata = { title: "My reports and disputes" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const actor = await pageMember();
  const subjectId = (await searchParams).subject?.slice(0, 100);
  const [subject] =
    subjectId && subjectId !== actor.id
      ? await getDb()
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(and(eq(user.id, subjectId), eq(user.status, "active")))
          .limit(1)
      : [];
  const cases = await getDb()
    .select({
      id: moderationCase.id,
      type: moderationCase.type,
      status: moderationCase.status,
      description: moderationCase.description,
      resolution: moderationCase.resolution,
      createdAt: moderationCase.createdAt,
      subjectName: user.name,
    })
    .from(moderationCase)
    .innerJoin(user, eq(user.id, moderationCase.subjectUserId))
    .where(eq(moderationCase.reporterId, actor.id))
    .orderBy(desc(moderationCase.createdAt))
    .limit(100);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Help keep MicroJobs trustworthy</p>
        <h1>My reports and disputes</h1>
        <p className="muted">
          Only you and administrators can see your case details. A case does not
          automatically suspend an account or affect a payment.
        </p>
      </div>
      {subject && subject.id !== actor.id && (
        <CaseForm subjectUserId={subject.id} subjectName={subject.name} />
      )}
      {!subject && (
        <section className="panel case-help-card">
          <div className="icon-tile">
            <Flag size={20} aria-hidden="true" />
          </div>
          <h2>Need to raise a concern?</h2>
          <p className="muted">
            To open a case, visit the person’s public portfolio and select
            “Report or dispute this account.”
          </p>
        </section>
      )}
      <section className="stack" style={{ marginTop: 26 }}>
        <h2>Submitted cases</h2>
        {cases.map((item) => (
          <article className="panel" key={item.id}>
            <div className="row spread">
              <h3>
                {item.type === "report" ? "Report" : "Dispute"} about{" "}
                {item.subjectName}
              </h3>
              <span className={`badge ${item.status}`}>
                {item.status.replace("_", " ")}
              </span>
            </div>
            <p className="small muted">
              {item.createdAt.toLocaleDateString("en-GB", {
                timeZone: "Asia/Dhaka",
              })}
            </p>
            <p className="case-copy">{item.description}</p>
            {item.resolution && (
              <p className="feedback success case-copy">
                <strong>Decision:</strong> {item.resolution}
              </p>
            )}
          </article>
        ))}
        {!cases.length && (
          <section className="panel empty">
            <FileCheck2 size={38} aria-hidden="true" />
            <h2>No cases submitted</h2>
            <p className="muted">You have not submitted a case yet.</p>
          </section>
        )}
        <Link href="/dashboard">← Back to overview</Link>
      </section>
    </>
  );
}
