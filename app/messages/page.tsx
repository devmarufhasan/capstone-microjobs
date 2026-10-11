import { PublicHeader } from "@/components/brand";
import { MessagePreview } from "@/components/marketplace-preview-workspaces";
export const metadata = { title: "Messages preview" };
export default function Page() {
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">Conversations</span>
          <h1>Messages</h1>
          <p>
            See the future conversation workspace. Every thread below is a
            sample; real user-to-user messaging is not available yet.
          </p>
          <span className="market-page-demo-note">
            Preview workspace · messages cannot be sent
          </span>
        </div>
        <MessagePreview />
      </main>
    </>
  );
}
