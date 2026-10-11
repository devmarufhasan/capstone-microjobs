import { PublicHeader } from "@/components/brand";
import { OrderPreview } from "@/components/marketplace-preview-workspaces";
export const metadata = { title: "Orders preview" };
export default function Page() {
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">Project workspace</span>
          <h1>Orders and progress</h1>
          <p>
            A preview of how project progress, delivery and completion will be
            organized. These are sample orders; no transactions exist here.
          </p>
          <span className="market-page-demo-note">
            Preview workspace · demo records
          </span>
        </div>
        <OrderPreview />
      </main>
    </>
  );
}
