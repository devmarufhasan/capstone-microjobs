import { desc, eq } from "drizzle-orm";
import { ShieldCheck, MailCheck } from "lucide-react";
import { VerificationForm } from "@/components/verification-form";
import { getDb } from "@/lib/db";
import { studentVerification } from "@/lib/db/schema";
import { pageMember } from "@/lib/http";
import { storageConfigured } from "@/lib/storage";
import { emailVerificationEnabled } from "@/lib/feature-flags";
export const metadata = { title: "Verification" };
export default async function Page() {
  const actor = await pageMember();
  const [latest] = await getDb()
    .select()
    .from(studentVerification)
    .where(eq(studentVerification.userId, actor.id))
    .orderBy(desc(studentVerification.createdAt))
    .limit(1);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Trust starts with you</p>
        <h1>Account verification</h1>
        <p className="muted">
          A little assurance goes a long way. Build confidence in your profile.
        </p>
      </div>
      <div className="grid-two verification-grid">
        <section className="panel verification-email-card">
          <div className="icon-tile">
            <MailCheck />
          </div>
          <h2>Email address</h2>
          <p className="muted small">{actor.email}</p>
          <span
            className={`badge ${actor.emailVerified ? "approved" : emailVerificationEnabled() ? "pending" : ""}`}
            style={{ justifySelf: "start" }}
          >
            {actor.emailVerified
              ? "✓ Email verified"
              : emailVerificationEnabled()
                ? "Not verified"
                : "Email check paused"}
          </span>
          <p className="muted small">
            {emailVerificationEnabled()
              ? "Email verification confirms you own your sign-in address. Student verification is a separate step."
              : "Email verification is currently optional. Student ID review remains a separate step."}
          </p>
        </section>
        <section className="panel stack verification-id-card">
          <div className="row spread">
            <div className="icon-tile">
              <ShieldCheck />
            </div>
            <span className={`badge ${latest?.status ?? ""}`}>
              {latest?.status ?? "Not started"}
            </span>
          </div>
          <h2>Student identity</h2>
          {latest?.status === "approved" ? (
            <>
              <h3>✓ You’re a Verified Student</h3>
              <p className="muted">
                Your university ID has been approved. Your badge appears on your
                public portfolio.
              </p>
            </>
          ) : latest?.status === "pending" ? (
            <>
              <p className="muted">
                Your ID is in the review queue. An administrator will check your
                submission.
              </p>
              <p className="small muted">
                {latest.university} · Submitted{" "}
                {latest.createdAt.toLocaleDateString("en-GB", {
                  timeZone: "Asia/Dhaka",
                })}
              </p>
            </>
          ) : (
            <>
              {latest?.status === "rejected" && (
                <p className="feedback error">
                  {latest.reason} You can submit a new request below.
                </p>
              )}
              <VerificationForm storage={storageConfigured()} />
            </>
          )}
        </section>
      </div>
    </>
  );
}
