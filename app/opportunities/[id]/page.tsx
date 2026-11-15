import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
} from "lucide-react";
import { PublicHeader } from "@/components/brand";
import { ApplicationForm } from "@/components/application-form";
import { categoryLabel } from "@/lib/demo-marketplace";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/http";
import { authConfigured } from "@/lib/auth";
import { getJobForViewer, today, toTaka } from "@/lib/marketplace";
import {
  applicationStatusLabel,
  formatDate,
  formatTaka,
  jobStatusLabel,
  locationLabel,
} from "@/lib/job-format";

export const metadata = { title: "Job details" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = authConfigured() ? await currentUser() : null;
  const detail = await getJobForViewer(getDb(), viewer, id);
  if (!detail) notFound();
  const { job, employerName, isOwner, ownApplication } = detail;
  const accepting = job.status === "open" && job.deadline >= today();
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-detail-page">
        <nav className="market-breadcrumb" aria-label="Breadcrumb">
          <Link href="/opportunities">
            <ArrowLeft size={16} aria-hidden="true" /> All jobs
          </Link>
          <span>/</span>
          <Link href={`/opportunities?category=${job.category}`}>
            {categoryLabel(job.category)}
          </Link>
        </nav>
        <div className="market-detail-layout">
          <article className="market-detail-main">
            <span className={`badge ${job.status}`}>
              {jobStatusLabel[job.status]}
            </span>
            <h1>{job.title}</h1>
            <div className="market-detail-seller">
              <span className="market-job-org-icon">
                <BriefcaseBusiness size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{employerName}</strong>
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>
            <section className="market-detail-copy market-job-detail-copy">
              <h2>About this job</h2>
              <p className="pre-wrap">{job.description}</p>
              <h3>Required skills</h3>
              <div className="market-job-skills">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <h3>Job snapshot</h3>
              <div className="market-job-snapshot">
                <span>
                  <CalendarClock size={18} aria-hidden="true" /> Deadline{" "}
                  {formatDate(job.deadline)}
                </span>
                <span>
                  <MapPin size={18} aria-hidden="true" />{" "}
                  {locationLabel(job.locationType, job.location)}
                </span>
              </div>
            </section>
          </article>
          <aside className="market-detail-aside">
            <div className="market-package-card">
              <div className="market-package-top">
                <span>Budget</span>
                <strong>{formatTaka(job.budgetPoisha)}</strong>
              </div>
              {isOwner ? (
                <>
                  <p>This is your job post.</p>
                  <Link href={`/jobs/${job.id}`} className="link-button">
                    Manage applications →
                  </Link>
                </>
              ) : !viewer ? (
                <>
                  <p>Sign in to send a proposal for this job.</p>
                  <Link href="/login" className="link-button">
                    Log in to apply
                  </Link>
                  <Link href="/register" className="market-package-secondary">
                    Create a free account →
                  </Link>
                </>
              ) : (
                <>
                  {ownApplication && (
                    <p>
                      Your application:{" "}
                      <span className={`badge ${ownApplication.status}`}>
                        {applicationStatusLabel[ownApplication.status]}
                      </span>
                    </p>
                  )}
                  {accepting ? (
                    <ApplicationForm
                      jobId={job.id}
                      budgetTaka={toTaka(job.budgetPoisha)}
                      existing={
                        ownApplication && {
                          id: ownApplication.id,
                          message: ownApplication.message,
                          proposedPriceTaka: toTaka(
                            ownApplication.proposedPricePoisha,
                          ),
                          deliveryDays: ownApplication.deliveryDays,
                          approach: ownApplication.approach,
                          suitability: ownApplication.suitability,
                          status: ownApplication.status,
                        }
                      }
                    />
                  ) : ownApplication?.status === "hired" ? (
                    <p>
                      You were hired for this job at{" "}
                      {formatTaka(ownApplication.proposedPricePoisha)} with{" "}
                      {ownApplication.deliveryDays}-day delivery.
                    </p>
                  ) : (
                    <p>This job is no longer accepting applications.</p>
                  )}
                  {ownApplication?.status === "hired" && (
                    <Link
                      href="/applications"
                      className="market-package-secondary"
                    >
                      View in my applications →
                    </Link>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
