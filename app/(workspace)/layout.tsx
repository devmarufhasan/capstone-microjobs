import { Brand } from "@/components/brand";
import { WorkspaceNav } from "@/components/workspace-nav";
import { AccountToolbox } from "@/components/account-toolbox";
import { pageUser } from "@/lib/http";
import { Sparkles } from "lucide-react";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await pageUser();
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <span className="sidebar-brand-tag">STUDIO</span>
        </div>
        <div>
          <p className="sidebar-label">Your workspace</p>
          <WorkspaceNav admin={actor.accessLevel === "administrator"} />
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-note">
            <Sparkles size={19} aria-hidden="true" />
            <strong>Keep building.</strong>
            <p>Every project adds to your story.</p>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <div className="workspace-header-location">
            <span className="workspace-header-dot" />
            <span>MicroJobs workspace</span>
            <span className="workspace-header-separator">/</span>
            <span className="badge workspace-mode">
              {actor.preferredMode === "student" ? "Student" : "Employer"} mode
            </span>
          </div>
          <AccountToolbox
            account={{
              name: actor.name,
              email: actor.email,
              image: actor.image,
              accessLevel: actor.accessLevel,
              preferredMode: actor.preferredMode,
            }}
          />
        </header>
        <main className="page">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
