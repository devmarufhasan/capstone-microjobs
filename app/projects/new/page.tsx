import { PublicHeader } from "@/components/brand";
import { ProjectBriefPreview } from "@/components/marketplace-preview-workspaces";
export const metadata = { title: "Post a project preview" };
export default function Page() {
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">For project posters</span>
          <h1>Tell students what you need</h1>
          <p>
            Sketch a small, clear brief. This composer is a UI preview and will
            not publish a job until the marketplace API is ready.
          </p>
          <span className="market-page-demo-note">
            Draft preview · nothing is saved
          </span>
        </div>
        <ProjectBriefPreview />
      </main>
    </>
  );
}
