"use client";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty state-card">
      <span className="state-icon">
        <RefreshCw size={29} aria-hidden="true" />
      </span>
      <h1>We couldn’t load this page.</h1>
      <p className="muted">Please try again in a moment.</p>
      <button className="link-button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
