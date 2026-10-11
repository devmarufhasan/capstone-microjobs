import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import {
  categoryLabel,
  type DemoOpportunity,
  type DemoService,
} from "@/lib/demo-marketplace";

export function ServiceCard({ service }: { service: DemoService }) {
  return (
    <article className="market-service-card">
      <Link
        href={`/explore/${service.slug}`}
        className="market-service-image-link"
        aria-label={`Preview ${service.title}`}
      >
        <Image
          src={service.image}
          alt=""
          width={720}
          height={720}
          sizes="(max-width: 650px) 85vw, (max-width: 1100px) 45vw, 24vw"
          className="market-service-image"
        />
        <span className="market-demo-tag">Demo listing</span>
      </Link>
      <div className="market-service-body">
        <div className="market-seller">
          <div className="market-seller-avatar" aria-hidden="true">
            {service.seller.slice(0, 1)}
          </div>
          <div className="market-seller-meta">
            <strong>{service.seller}</strong>
            <span>{service.university}</span>
          </div>
        </div>
        <Link
          href={`/explore/${service.slug}`}
          className="market-service-title"
        >
          {service.title}
        </Link>
        <div className="market-card-footer">
          <span>{categoryLabel(service.category)}</span>
          <strong>
            From ৳{service.priceFromBdt.toLocaleString("en-BD")}{" "}
            <small>sample</small>
          </strong>
        </div>
      </div>
    </article>
  );
}

export function OpportunityCard({
  opportunity,
}: {
  opportunity: DemoOpportunity;
}) {
  return (
    <article className="market-job-card">
      <div className="market-job-top">
        <span className="market-job-category">
          {categoryLabel(opportunity.category)}
        </span>
        <span className="market-demo-tag market-demo-tag-inline">
          Demo opportunity
        </span>
      </div>
      <Link
        href={`/opportunities/${opportunity.slug}`}
        className="market-job-title"
      >
        {opportunity.title}
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
      <p className="market-job-org">{opportunity.organization}</p>
      <p className="market-job-summary">{opportunity.summary}</p>
      <div className="market-job-skills">
        {opportunity.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <div className="market-job-bottom">
        <span>
          <Clock3 size={15} aria-hidden="true" /> {opportunity.timeframe}
        </span>
        <span>
          <MapPin size={15} aria-hidden="true" /> {opportunity.format}
        </span>
        <strong>
          ৳{opportunity.budgetBdt.toLocaleString("en-BD")}{" "}
          <small>sample budget</small>
        </strong>
      </div>
    </article>
  );
}
