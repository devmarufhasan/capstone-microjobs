import Link from "next/link";
import { CalendarClock, Compass } from "lucide-react";
import { getDb } from "@/lib/db";
import { pageMember } from "@/lib/http";
import { listStudentApplications } from "@/lib/marketplace";
import {
  applicationStatusLabel,
  formatDate,
  formatTaka,
  jobStatusLabel,
} from "@/lib/job-format";
export const metadata = { title: "My applications" };
// Module 2 · Apply for Jobs / Job Proposal System: the student's proposals.
export default async function Page() {
  const actor = await pageMember();
  const rows = await listStudentApplications(getDb(), actor);
  return (
    <>
      <div className="page-heading row spread">
        <div>
          <p className="eyebrow">For students</p>
          <h1>My applications</h1>
          <p className="muted">Track every proposal you have sent.</p>
        </div>
        <Link href="/opportunities" className="link-button">
          <Compass size={17} aria-hidden="true" /> Find work
        </Link>
      </div>
      {rows.length ? (
        <div className="job-list">
          {rows.map(({ application, job, employerName }) => (
            <section key={application.id} className="panel job-list-item">
              <div className="row spread">
                <h3>
                  <Link href={`/opportunities/${job.id}`}>{job.title}</Link>
                </h3>
                <span className={`badge ${application.status}`}>
                  {applicationStatusLabel[application.status]}
                </span>
              </div>
              <div className="job-meta">
                <span>{employerName}</span>
                <span>
                  Your price {formatTaka(application.proposedPricePoisha)} ·{" "}
                  {application.deliveryDays} day
                  {application.deliveryDays === 1 ? "" : "s"}
                </span>
                <span>Budget {formatTaka(job.budgetPoisha)}</span>
                <span>
                  <CalendarClock size={14} aria-hidden="true" /> Due{" "}
                  {formatDate(job.deadline)}
                </span>
                <span>Job: {jobStatusLabel[job.status]}</span>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel stack">
          <h2>No applications yet</h2>
          <p className="muted">
            Browse open jobs and send your first proposal.
          </p>
          <Link
            href="/opportunities"
            className="link-button"
            style={{ justifySelf: "start" }}
          >
            Find work
          </Link>
        </section>
      )}
    </>
  );
}
