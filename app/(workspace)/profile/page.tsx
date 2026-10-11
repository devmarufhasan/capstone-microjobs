import { SessionManager } from "@/components/session-manager";
import { ProfileForm } from "@/components/profile-form";
import { pageUser } from "@/lib/http";
import Link from "next/link";
import { ArrowUpRight, Eye, Layers3 } from "lucide-react";
export const metadata = { title: "My profile" };
export default async function Page() {
  const actor = await pageUser();
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">A little about you</p>
        <h1>My profile</h1>
        <p className="muted">Introduce the person behind the work.</p>
      </div>
      <div className="profile-grid">
        <section className="panel profile-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The essentials</p>
              <h2>Personal details</h2>
            </div>
            <div className="icon-tile">
              <Layers3 size={20} aria-hidden="true" />
            </div>
          </div>
          <ProfileForm
            profile={{
              name: actor.name,
              bio: actor.bio,
              preferredMode: actor.preferredMode,
              email: actor.email,
            }}
          />
        </section>
        <aside className="panel profile-preview-card">
          <div className="icon-tile">
            <Eye size={21} aria-hidden="true" />
          </div>
          <p className="eyebrow">Your public presence</p>
          <h2>A profile built around you.</h2>
          <p className="muted small">
            Your name and bio appear at your public portfolio link. Projects
            stay private until you choose to publish them.
          </p>
          <Link
            href={`/users/${actor.id}/portfolio`}
            className="profile-preview-link"
          >
            View public portfolio <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </aside>
      </div>
      <SessionManager />
    </>
  );
}
