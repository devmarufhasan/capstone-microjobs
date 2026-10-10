import Link from "next/link";
import { Layers3, Plus, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/brand";
import { ServiceCard } from "@/components/marketplace-cards";
import { demoServices } from "@/lib/demo-marketplace";
export const metadata = { title: "My services preview" };
export default function Page() {
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">For student creators</span>
          <h1>Your service storefront</h1>
          <p>
            This is where students will manage their own services. Listing
            creation is a preview; your real portfolio already works today.
          </p>
          <span className="market-page-demo-note">
            Preview workspace · no live service listings
          </span>
        </div>
        <section className="seller-empty-state">
          <span className="seller-empty-icon">
            <Layers3 size={29} aria-hidden="true" />
          </span>
          <div>
            <h2>Your services will live here</h2>
            <p>
              Use your portfolio to show your skills now. Service publishing
              will be connected when the marketplace module is implemented.
            </p>
            <Link
              href="/portfolio"
              className="market-button market-button-dark"
            >
              Open my portfolio →
            </Link>
          </div>
          <button type="button" disabled>
            <Plus size={17} aria-hidden="true" /> Create service · coming soon
          </button>
        </section>
        <section className="market-related">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">
                <Sparkles size={13} aria-hidden="true" /> Inspiration
              </span>
              <h2>What a service card could look like</h2>
              <p>Examples below belong to demo students, not your account.</p>
            </div>
          </div>
          <div className="market-service-grid">
            {demoServices.slice(0, 3).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
