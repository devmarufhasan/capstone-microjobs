import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeInfo,
  BriefcaseBusiness,
  Clock3,
  MapPin,
} from "lucide-react";
import { PublicHeader } from "@/components/brand";
import { OpportunityCard } from "@/components/marketplace-cards";
import { categoryLabel, demoOpportunities } from "@/lib/demo-marketplace";

export const metadata = { title: "Student opportunity preview" };
export function generateStaticParams() {
  return demoOpportunities.map((item) => ({ slug: item.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = demoOpportunities.find((item) => item.slug === slug);
  if (!job) notFound();
  const related = demoOpportunities
    .filter((item) => item.slug !== slug)
    .slice(0, 2);
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-detail-page">
        <nav className="market-breadcrumb" aria-label="Breadcrumb">
          <Link href="/opportunities">
            <ArrowLeft size={16} aria-hidden="true" /> All opportunities
          </Link>
          <span>/</span>
          <Link href={`/opportunities?category=${job.category}`}>
            {categoryLabel(job.category)}
          </Link>
        </nav>
        <div className="market-detail-layout">
          <article className="market-detail-main">
            <span className="market-page-demo-note">
              Demo opportunity · Preview only
            </span>
            <h1>{job.title}</h1>
            <div className="market-detail-seller">
              <span className="market-job-org-icon">
                <BriefcaseBusiness size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{job.organization}</strong>
                <span>Sample brief · not a real employer posting</span>
              </div>
            </div>
            <section className="market-detail-copy market-job-detail-copy">
              <h2>About this sample project</h2>
              <p>{job.summary}</p>
              <p>
                This illustrates how a small employer brief will be presented.
                There is no live application or hiring flow yet.
              </p>
              <h3>Useful skills</h3>
              <div className="market-job-skills">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <h3>Project snapshot</h3>
              <div className="market-job-snapshot">
                <span>
                  <Clock3 size={18} aria-hidden="true" /> {job.timeframe} sample
                  timeline
                </span>
                <span>
                  <MapPin size={18} aria-hidden="true" /> {job.format}
                </span>
              </div>
            </section>
          </article>
          <aside className="market-detail-aside">
            <div className="market-package-card">
              <div className="market-package-top">
                <span>Sample budget</span>
                <strong>৳{job.budgetBdt.toLocaleString("en-BD")}</strong>
              </div>
              <p>
                Preview this opportunity and prepare your profile before real
                applications launch.
              </p>
              <button type="button" disabled>
                Applications are not open yet
              </button>
              <p className="market-package-disclaimer">
                <BadgeInfo size={16} aria-hidden="true" /> This is demo data; no
                application will be submitted.
              </p>
              <Link href="/portfolio" className="market-package-secondary">
                Build your portfolio →
              </Link>
            </div>
          </aside>
        </div>
        <section className="market-related">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">More to explore</span>
              <h2>Other opportunity previews</h2>
            </div>
            <Link href="/opportunities" className="market-text-link">
              See all opportunities →
            </Link>
          </div>
          <div className="market-opportunity-grid">
            {related.map((item) => (
              <OpportunityCard key={item.id} opportunity={item} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
