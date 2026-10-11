import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  UserRound,
  Search,
  Compass,
} from "lucide-react";
import { pageMember } from "@/lib/http";
import { getDb } from "@/lib/db";
import { portfolio, studentVerification } from "@/lib/db/schema";
import { emailVerificationEnabled } from "@/lib/feature-flags";
import { OpportunityCard, ServiceCard } from "@/components/marketplace-cards";
import { demoOpportunities, demoServices } from "@/lib/demo-marketplace";
export const metadata = { title: "Overview" };
export default async function Page() {
  const actor = await pageMember();
  const [[items], [approved]] = await Promise.all([
    getDb()
      .select({ total: count() })
      .from(portfolio)
      .where(eq(portfolio.ownerId, actor.id)),
    getDb()
      .select({ id: studentVerification.id })
      .from(studentVerification)
      .where(
        and(
          eq(studentVerification.userId, actor.id),
          eq(studentVerification.status, "approved"),
        ),
      )
      .limit(1),
  ]);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your workspace, your possibilities</p>
        <h1>
          Welcome, {actor.name.split(" ")[0]}{" "}
          <span style={{ color: "#6c917f" }}>↗</span>
        </h1>
        <p className="muted">
          Your profile, portfolio and a world of student-powered possibility in
          one place.
        </p>
      </div>
      <section className="dashboard-market-banner">
        <div>
          <p className="eyebrow">Discover the marketplace</p>
          <h2>
            {actor.preferredMode === "student"
              ? "Find a project worth starting."
              : "Find a student who gets it."}
          </h2>
          <p>
            {actor.preferredMode === "student"
              ? "Explore a preview of short projects built around student skills."
              : "Browse sample services and see the talent behind the work."}
          </p>
        </div>
        <div className="dashboard-market-actions">
          <form action="/explore" role="search">
            <Search size={18} aria-hidden="true" />
            <input
              name="q"
              type="search"
              placeholder="Search student services"
              aria-label="Search student services"
            />
            <button type="submit" aria-label="Search student services">
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <Link href="/opportunities">
            <Compass size={17} aria-hidden="true" /> Browse opportunities{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href={actor.preferredMode === "student" ? "/seller/services" : "/projects/new"}>
            {actor.preferredMode === "student" ? "My service storefront" : "Draft a project brief"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="grid-three dashboard-stats">
        <section className="panel dashboard-stat">
          <div className="row spread">
            <p className="muted small">Portfolio projects</p>
            <BriefcaseBusiness size={19} />
          </div>
          <p className="stat">{items.total}</p>
          <p className="muted small">Your skills, made visible</p>
        </section>
        <section className="panel dashboard-stat">
          <div className="row spread">
            <p className="muted small">Email verification</p>
            <CheckCircle2 size={19} />
          </div>
          <p className="stat" style={{ fontSize: 25 }}>
            {actor.emailVerified
              ? "Verified"
              : emailVerificationEnabled()
                ? "Not verified"
                : "Check paused"}
          </p>
          <p className="muted small">
            {emailVerificationEnabled()
              ? "A secure start to your account"
              : "Email verification is optional for now"}
          </p>
        </section>
        <section className="panel dashboard-stat">
          <div className="row spread">
            <p className="muted small">Student identity</p>
            <ShieldCheck size={19} />
          </div>
          <p className="stat" style={{ fontSize: 25 }}>
            {approved ? "Verified student" : "Build your trust"}
          </p>
          <p className="muted small">University ID reviewed by our team</p>
        </section>
      </div>
      <div className="grid-two" style={{ marginTop: 26 }}>
        <section className="panel dashboard-checklist">
          <h2>Make your first impression count</h2>
          <div className="checklist">
            {[
              [
                "/profile",
                "Tell your story",
                "Add a name and a little about yourself.",
                UserRound,
              ],
              [
                "/verification",
                "Verify your student identity",
                "Submit your university ID for a trust badge.",
                ShieldCheck,
              ],
              [
                "/portfolio",
                "Let your work speak",
                "Share projects, certificates and work samples.",
                BriefcaseBusiness,
              ],
            ].map(([href, title, desc, Icon]) => {
              const C = Icon as typeof UserRound;
              return (
                <Link key={String(href)} href={String(href)}>
                  <div className="icon-tile">
                    <C size={20} />
                  </div>
                  <span>
                    <h3>{String(title)}</h3>
                    <p className="muted small">{String(desc)}</p>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              );
            })}
          </div>
        </section>
        <section className="panel stack dashboard-inspiration">
          <p className="eyebrow">A profile with possibilities</p>
          <h2>
            Today’s project could be
            <br />
            tomorrow’s opportunity.
          </h2>
          <p className="muted">
            Your coursework, personal projects and certificates all tell a
            story. Start with one piece of work that matters to you.
          </p>
          <Link
            className="link-button"
            href="/portfolio"
            style={{ justifySelf: "start", alignSelf: "end" }}
          >
            Add your first project <ArrowRight size={17} />
          </Link>
        </section>
      </div>
      <section className="dashboard-preview-section">
        <div className="market-section-heading">
          <div>
            <span className="market-overline">Marketplace preview</span>
            <h2>
              {actor.preferredMode === "student"
                ? "Opportunities to explore"
                : "Student services to explore"}
            </h2>
            <p>
              These are sample listings; applications and bookings are not
              available yet.
            </p>
          </div>
          <Link
            href={
              actor.preferredMode === "student" ? "/opportunities" : "/explore"
            }
            className="market-text-link"
          >
            Browse all <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {actor.preferredMode === "student" ? (
          <div className="market-opportunity-grid">
            {demoOpportunities.slice(0, 2).map((job) => (
              <OpportunityCard key={job.id} opportunity={job} />
            ))}
          </div>
        ) : (
          <div className="market-service-grid">
            {demoServices.slice(0, 3).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
