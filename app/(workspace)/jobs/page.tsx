import Link from "next/link";
import { CalendarClock, FilePlus2, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { pageMember } from "@/lib/http";
import { listEmployerJobs } from "@/lib/marketplace";
import { formatDate, formatTaka, jobStatusLabel } from "@/lib/job-format";
export const metadata = { title: "My jobs" };
export default async function Page() {
  const actor = await pageMember();
  const rows = await listEmployerJobs(getDb(), actor);
  return (
    <>
      <div className="page-heading row spread">
        <div>
          <p className="eyebrow">For employers</p>
          <h1>My jobs</h1>
          <p className="muted">Review proposals and hire the right student.</p>
        </div>
        <Link href="/jobs/new" className="link-button">
          <FilePlus2 size={17} aria-hidden="true" /> Post a job
        </Link>
      </div>
      {rows.length ? (
        <div className="job-list">
          {rows.map(({ job, applications }) => (
            <section key={job.id} className="panel job-list-item">
              <div className="row spread">
                <h3>
                  <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                </h3>
                <span className={`badge ${job.status}`}>
                  {jobStatusLabel[job.status]}
                </span>
              </div>
              <div className="job-meta">
                <span>{formatTaka(job.budgetPoisha)} budget</span>
                <span>
                  <CalendarClock size={14} aria-hidden="true" /> Due{" "}
                  {formatDate(job.deadline)}
                </span>
                <span>
                  <Users size={14} aria-hidden="true" /> {applications}{" "}
                  {applications === 1 ? "application" : "applications"}
                </span>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel stack">
          <h2>No jobs yet</h2>
          <p className="muted">
            Post your first small task and students will start sending
            proposals.
          </p>
          <Link
            href="/jobs/new"
            className="link-button"
            style={{ justifySelf: "start" }}
          >
            Post a job
          </Link>
        </section>
      )}
    </>
  );
}
