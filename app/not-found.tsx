import Link from "next/link";
import { PublicHeader } from "@/components/brand";
import { Compass } from "lucide-react";
export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="page state-page">
        <section className="panel empty state-card">
          <span className="state-icon">
            <Compass size={29} aria-hidden="true" />
          </span>
          <h1>This page isn’t here.</h1>
          <p className="muted">
            The link may have changed, or this page may no longer be available.
          </p>
          <Link href="/" className="link-button">
            Back to MicroJobs
          </Link>
        </section>
      </main>
    </>
  );
}
