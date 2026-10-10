import Link from "next/link";
import { PublicHeader } from "@/components/brand";
import { LockKeyhole } from "lucide-react";
export default function Page() {
  return (
    <>
      <PublicHeader />
      <main className="page state-page">
        <section className="panel empty state-card">
          <span className="state-icon">
            <LockKeyhole size={29} aria-hidden="true" />
          </span>
          <h1>This space is restricted.</h1>
          <p className="muted">
            Your account doesn’t have access to this page.
          </p>
          <Link href="/dashboard" className="link-button">
            Back to your workspace
          </Link>
        </section>
      </main>
    </>
  );
}
