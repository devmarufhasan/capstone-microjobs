import { PublicHeader } from "@/components/brand";
import { OpportunityExplorer } from "@/components/marketplace-explore";
import { categories, type MarketplaceCategory } from "@/lib/demo-marketplace";

export const metadata = { title: "Student opportunities" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selected = categories.some((item) => item.id === category)
    ? (category as MarketplaceCategory)
    : "all";
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">
            A place to find your first step
          </span>
          <h1>Explore student opportunities</h1>
          <p>
            See how small projects will be discovered in MicroJobs. These are
            sample briefs; applications are not open until the job module is
            built.
          </p>
          <span className="market-page-demo-note">
            Preview experience · demo data
          </span>
        </div>
        <OpportunityExplorer key={selected} initialCategory={selected} />
      </main>
    </>
  );
}
