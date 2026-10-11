import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeInfo, Check, Clock3, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/brand";
import { ServiceCard } from "@/components/marketplace-cards";
import { categoryLabel, demoServices } from "@/lib/demo-marketplace";

export const metadata = { title: "Student service preview" };
export function generateStaticParams() {
  return demoServices.map((service) => ({ slug: service.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = demoServices.find((item) => item.slug === slug);
  if (!service) notFound();
  const related = demoServices.filter((item) => item.slug !== slug).slice(0, 3);
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-detail-page">
        <nav className="market-breadcrumb" aria-label="Breadcrumb">
          <Link href="/explore">
            <ArrowLeft size={16} aria-hidden="true" /> All services
          </Link>
          <span>/</span>
          <Link href={`/explore?category=${service.category}`}>
            {categoryLabel(service.category)}
          </Link>
        </nav>
        <div className="market-detail-layout">
          <article className="market-detail-main">
            <span className="market-page-demo-note">
              Demo service · Preview only
            </span>
            <h1>{service.title}</h1>
            <div className="market-detail-seller">
              <div className="market-seller-avatar" aria-hidden="true">
                {service.seller.slice(0, 1)}
              </div>
              <div className="market-seller-meta">
                <strong>{service.seller}</strong>
                <span>{service.university} · Sample profile</span>
              </div>
            </div>
            <div className="market-detail-image">
              <Image
                src={service.image}
                alt={`Preview of ${categoryLabel(service.category).toLowerCase()} work`}
                width={720}
                height={720}
                sizes="(max-width: 900px) 100vw, 66vw"
              />
            </div>
            <section className="market-detail-copy">
              <h2>About this sample service</h2>
              <p>{service.summary}</p>
              <p>
                This page demonstrates how a student service listing could
                appear after the marketplace module is connected. The sample
                student and price are illustrative.
              </p>
              <h3>What this sample includes</h3>
              <ul>
                {service.includes.map((item) => (
                  <li key={item}>
                    <Check size={17} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <h3>Skills</h3>
              <div className="market-job-skills">
                {service.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>
          </article>
          <aside className="market-detail-aside">
            <div className="market-package-card">
              <div className="market-package-top">
                <span>Sample starter package</span>
                <strong>৳{service.priceFromBdt.toLocaleString("en-BD")}</strong>
              </div>
              <p>{service.summary}</p>
              <div className="market-package-meta">
                <Clock3 size={17} aria-hidden="true" /> Sample delivery:{" "}
                {service.deliveryDays} days
              </div>
              <div className="market-package-meta">
                <ShieldCheck size={17} aria-hidden="true" /> Student ID review
                is a separate live feature
              </div>
              <button type="button" disabled>
                Booking opens in a future module
              </button>
              <p className="market-package-disclaimer">
                <BadgeInfo size={16} aria-hidden="true" /> No order or payment
                will be created.
              </p>
            </div>
          </aside>
        </div>
        <section className="market-related">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">Keep exploring</span>
              <h2>More student service previews</h2>
            </div>
            <Link href="/explore" className="market-text-link">
              See all services →
            </Link>
          </div>
          <div className="market-service-grid">
            {related.map((item) => (
              <ServiceCard key={item.id} service={item} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
