import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { PublicHeader } from "@/components/brand";
import { JobCard } from "@/components/marketplace-cards";
import { categories } from "@/lib/demo-marketplace";
import { getDb } from "@/lib/db";
import { searchOpenJobs } from "@/lib/marketplace";
import { jobSearchInput } from "@/lib/validation";

export const metadata = { title: "Find work" };
// Module 2 · Apply for Jobs: students browse and search open jobs.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const search = jobSearchInput.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    category: typeof raw.category === "string" ? raw.category : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : "newest",
  });
  const results = await searchOpenJobs(getDb(), search);
  const href = (category?: string) => {
    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (category) params.set("category", category);
    if (search.sort !== "newest") params.set("sort", search.sort);
    const query = params.toString();
    return `/opportunities${query ? `?${query}` : ""}`;
  };
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-listing-page">
        <div className="market-page-intro">
          <span className="market-overline">
            A place to find your first step
          </span>
          <h1>Find work</h1>
          <p>
            Short, small-budget jobs posted by individuals, shops and small
            businesses. Open a job to send your proposal.
          </p>
        </div>
        <div className="market-explorer">
          <form
            className="market-explorer-toolbar"
            role="search"
            action="/opportunities"
          >
            <label className="market-explorer-search">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={search.q}
                placeholder="Search jobs by title, description or skill"
                aria-label="Search jobs"
              />
            </label>
            {search.category && (
              <input type="hidden" name="category" value={search.category} />
            )}
            <label className="market-sort">
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span>Sort</span>
              <select
                name="sort"
                defaultValue={search.sort}
                aria-label="Sort jobs"
              >
                <option value="newest">Newest</option>
                <option value="budget-high">Budget: high to low</option>
                <option value="budget-low">Budget: low to high</option>
                <option value="deadline">Deadline: soonest</option>
              </select>
            </label>
            <button type="submit" className="link-button">
              Search
            </button>
          </form>
          <div
            className="market-filter-chips"
            role="group"
            aria-label="Filter jobs by category"
          >
            <Link href={href()} className={!search.category ? "active" : ""}>
              All jobs
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={href(item.id)}
                className={search.category === item.id ? "active" : ""}
                aria-current={search.category === item.id ? "true" : undefined}
              >
                {item.short}
              </Link>
            ))}
          </div>
          <div className="market-result-meta">
            <strong>
              {results.length} open {results.length === 1 ? "job" : "jobs"}
            </strong>
            <Link href="/jobs/new" className="market-text-link">
              Need help? Post a job →
            </Link>
          </div>
          {results.length ? (
            <div className="market-opportunity-grid">
              {results.map((row) => (
                <JobCard
                  key={row.job.id}
                  job={row.job}
                  employerName={row.employerName}
                  applications={row.applications}
                />
              ))}
            </div>
          ) : (
            <div className="market-explorer-empty">
              <Search size={33} aria-hidden="true" />
              <h2>No open jobs match</h2>
              <p>Try a different search or category, or check back soon.</p>
              <Link href="/opportunities" className="link-button">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
