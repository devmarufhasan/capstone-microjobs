"use client";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page state-page">
      <section className="panel empty state-card">
        <span className="state-icon">
          <RefreshCw size={29} aria-hidden="true" />
        </span>
        <h1>Something interrupted your visit.</h1>
        <p className="muted">Please try again in a moment.</p>
        <button className="link-button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
