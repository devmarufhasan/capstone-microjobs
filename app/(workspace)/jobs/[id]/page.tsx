import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarClock, MapPin, Pencil } from "lucide-react";
import {
  ApplicantActions,
  CloseJobButton,
} from "@/components/applicant-actions";
import { getDb } from "@/lib/db";
import { pageMember } from "@/lib/http";
import { listJobApplications } from "@/lib/marketplace";
import { DomainError } from "@/lib/services";
import {
  applicationStatusLabel,
  formatDate,
  formatTaka,
  jobStatusLabel,
  locationLabel,
} from "@/lib/job-format";
export const metadata = { title: "Manage job" };
// Module 2 · Hire Students: review applications, proposals and profiles.
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await pageMember();
  const { id } = await params;
  const data = await listJobApplications(getDb(), actor, id).catch((error) => {
    if (error instanceof DomainError && error.status === 404) notFound();
    throw error;
  });
  const { job, applications } = data;
  const hired = applications.find((row) => row.application.status === "hired");
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">
          <Link href="/jobs">My jobs</Link> / Manage
        </p>
        <div className="row spread">
          <h1>{job.title}</h1>
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
            <MapPin size={14} aria-hidden="true" />{" "}
            {locationLabel(job.locationType, job.location)}
          </span>
          <Link href={`/opportunities/${job.id}`}>View public post →</Link>
        </div>
        {job.status === "open" && (
          <div className="row" style={{ marginTop: 12 }}>
            <Link
              href={`/jobs/${job.id}/edit`}
              className="link-button secondary"
            >
              <Pencil size={15} aria-hidden="true" /> Edit job
            </Link>
            <CloseJobButton jobId={job.id} />
          </div>
        )}
      </div>
      {hired && (
        <section className="panel stack" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Hired student</p>
          <h2>{hired.student.name}</h2>
          <p className="muted">
            Agreed price {formatTaka(hired.application.proposedPricePoisha)} ·{" "}
            {hired.application.deliveryDays}-day delivery · hired{" "}
            {job.hiredAt ? formatDate(job.hiredAt) : ""}
          </p>
        </section>
      )}
      <h2 style={{ margin: "8px 0 14px" }}>
        Applications ({applications.length})
      </h2>
      {applications.length ? (
        <div className="job-list">
          {applications.map(
            ({
              application,
              student,
              verifiedStudent,
              publicPortfolioItems,
            }) => (
              <section key={application.id} className="panel applicant-card">
                <div className="row spread">
                  <div>
                    <h3>
                      {student.name}{" "}
                      {verifiedStudent && (
                        <span className="badge approved">
                          <BadgeCheck size={13} aria-hidden="true" /> Verified
                          Student
                        </span>
                      )}
                    </h3>
                    {student.bio && (
                      <p className="muted small">{student.bio}</p>
                    )}
                  </div>
                  <span className={`badge ${application.status}`}>
                    {applicationStatusLabel[application.status]}
                  </span>
                </div>
                <div className="job-meta">
                  <strong>{formatTaka(application.proposedPricePoisha)}</strong>
                  <span>
                    {application.deliveryDays} day
                    {application.deliveryDays === 1 ? "" : "s"} delivery
                  </span>
                  <span>Applied {formatDate(application.createdAt)}</span>
                  {publicPortfolioItems > 0 ? (
                    <Link href={`/users/${student.id}/portfolio`}>
                      Portfolio ({publicPortfolioItems}) →
                    </Link>
                  ) : (
                    <span>No public portfolio yet</span>
                  )}
                </div>
                <blockquote>{application.message}</blockquote>
                {application.approach && (
                  <div>
                    <strong className="small">Approach</strong>
                    <p className="pre-wrap small">{application.approach}</p>
                  </div>
                )}
                {application.suitability && (
                  <div>
                    <strong className="small">Why they are a good fit</strong>
                    <p className="pre-wrap small">{application.suitability}</p>
                  </div>
                )}
                {job.status === "open" && (
                  <ApplicantActions
                    applicationId={application.id}
                    status={application.status}
                    studentName={student.name}
                  />
                )}
              </section>
            ),
          )}
        </div>
      ) : (
        <section className="panel">
          <p className="muted">
            No applications yet. Students will see this job under Find work.
          </p>
        </section>
      )}
    </>
  );
}
