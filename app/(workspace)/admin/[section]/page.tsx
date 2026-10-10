import Link from "next/link";
import { notFound } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq } from "drizzle-orm";
import { CaseReviewAction } from "@/components/case-review-action";
import { getDb } from "@/lib/db";
import { moderationCase, user } from "@/lib/db/schema";
import { pageUser } from "@/lib/http";
import { ClipboardCheck } from "lucide-react";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const actor = await pageUser(true);
  const { section } = await params;
  if (!["jobs", "reports", "disputes"].includes(section)) notFound();
  if (section === "jobs")
    return (
      <section className="panel empty">
        <p className="eyebrow">Marketplace integration</p>
        <h1>Job moderation</h1>
        <p className="muted">
          The shared job model and posting flow are not available yet. Job
          moderation will connect to those records when the marketplace module
          is ready.
        </p>
      </section>
    );

  const type = section === "reports" ? "report" : "dispute";
  const filters = await searchParams;
  const status = ["open", "under_review", "resolved", "rejected"].includes(
    filters.status ?? "",
  )
    ? (filters.status as "open" | "under_review" | "resolved" | "rejected")
    : undefined;
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt(filters.page ?? "1") || 1),
  );
  const pageLink = (number: number) =>
    `/admin/${section}?${new URLSearchParams({ page: String(number), ...(status ? { status } : {}) })}`;
  const reporter = alias(user, "case_reporter"),
    subject = alias(user, "case_subject");
  const rows = await getDb()
    .select({
      item: moderationCase,
      reporter: { name: reporter.name, email: reporter.email },
      subject: { name: subject.name, email: subject.email },
    })
    .from(moderationCase)
    .innerJoin(reporter, eq(reporter.id, moderationCase.reporterId))
    .innerJoin(subject, eq(subject.id, moderationCase.subjectUserId))
    .where(
      and(
        eq(moderationCase.type, type),
        status ? eq(moderationCase.status, status) : undefined,
      ),
    )
    .orderBy(desc(moderationCase.createdAt))
    .limit(21)
    .offset((page - 1) * 20);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Community care</p>
        <h1>
          {section === "reports" ? "Account reports" : "Account disputes"}
        </h1>
        <p className="muted">
          Review details, record a reason, and keep an auditable decision.
          Reporter information is restricted to administrators.
        </p>
      </div>
      <div className="stack">
        <form className="row admin-filter-form" method="get">
          <label className="field" style={{ maxWidth: 240 }}>
            <span>Case status</span>
            <select
              className="native-select"
              name="status"
              defaultValue={status ?? ""}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <button
            className="link-button"
            type="submit"
            style={{ alignSelf: "end" }}
          >
            Filter cases
          </button>
        </form>
        {rows.slice(0, 20).map(({ item, reporter: from, subject: about }) => (
          <section className="panel stack" key={item.id}>
            <div className="row spread">
              <h2>{about.name}</h2>
              <span className={`badge ${item.status}`}>
                {item.status.replace("_", " ")}
              </span>
            </div>
            <p className="small muted">
              Reported by {from.name} ({from.email}) · Subject {about.email} ·{" "}
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
            {item.reporterId === actor.id || item.subjectUserId === actor.id ? (
              <p className="muted small">
                Another administrator must review this case.
              </p>
            ) : (
              <CaseReviewAction id={item.id} status={item.status} />
            )}
          </section>
        ))}
        {!rows.length && (
          <section className="panel empty">
            <ClipboardCheck size={42} aria-hidden="true" />
            <h2>No cases found</h2>
            <p className="muted">No {section} on this page.</p>
          </section>
        )}
        <div className="row spread">
          {page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}
          {rows.length > 20 && <Link href={pageLink(page + 1)}>Next →</Link>}
        </div>
      </div>
    </>
  );
}
