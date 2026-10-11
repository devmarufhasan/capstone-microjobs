import { PublicHeader } from "@/components/brand";
import { ServiceExplorer } from "@/components/marketplace-explore";
import { categories, type MarketplaceCategory } from "@/lib/demo-marketplace";

export const metadata = { title: "Explore student services" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const selected = categories.some((item) => item.id === category)
    ? (category as MarketplaceCategory)
    : "all";
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">MicroJobs service marketplace</span>
          <h1>Explore student services</h1>
          <p>
            Discover what university students can create. These sample listings
            preview the marketplace structure; booking is not available yet.
          </p>
          <span className="market-page-demo-note">
            Preview experience · demo data
          </span>
        </div>
        <ServiceExplorer
          key={`${q ?? ""}-${selected}`}
          initialQuery={(q ?? "").slice(0, 100)}
          initialCategory={selected}
        />
      </main>
    </>
  );
}
