import Link from "next/link";
import { PublicHeader } from "@/components/brand";
import { Settings2 } from "lucide-react";
export default function Page() {
  return (
    <>
      <PublicHeader />
      <main className="page state-page">
        <section className="panel empty state-card">
          <span className="state-icon">
            <Settings2 size={29} aria-hidden="true" />
          </span>
          <h1>We’re getting things ready.</h1>
          <p className="muted">
            Account services aren’t available yet. Please check back shortly.
          </p>
          <Link href="/" className="link-button">
            Back to MicroJobs
          </Link>
        </section>
      </main>
    </>
  );
}
