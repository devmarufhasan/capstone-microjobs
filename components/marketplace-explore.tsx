"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  categories,
  demoOpportunities,
  demoServices,
  type MarketplaceCategory,
} from "@/lib/demo-marketplace";
import { OpportunityCard, ServiceCard } from "./marketplace-cards";

type Category = MarketplaceCategory | "all";

export function ServiceExplorer({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string;
  initialCategory: Category;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [sort, setSort] = useState("featured");
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = demoServices.filter(
      (service) =>
        (category === "all" || service.category === category) &&
        (!term ||
          [service.title, service.summary, service.seller, ...service.skills]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
    return sort === "price-low"
      ? [...filtered].sort((a, b) => a.priceFromBdt - b.priceFromBdt)
      : sort === "price-high"
        ? [...filtered].sort((a, b) => b.priceFromBdt - a.priceFromBdt)
        : filtered;
  }, [query, category, sort]);
  return (
    <div className="market-explorer">
      <div className="market-explorer-toolbar">
        <label className="market-explorer-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services or skills"
            aria-label="Search services or skills"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={17} />
            </button>
          )}
        </label>
        <label className="market-sort">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort services"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div
        className="market-filter-chips"
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          className={category === "all" ? "active" : ""}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          All services
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? "active" : ""}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.short}
          </button>
        ))}
      </div>
      <div className="market-result-meta">
        <strong>
          {results.length}{" "}
          {results.length === 1 ? "sample service" : "sample services"}
        </strong>
        <span>Preview data · no bookings yet</span>
      </div>
      {results.length ? (
        <div className="market-service-grid">
          {results.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="market-explorer-empty">
          <Search size={33} aria-hidden="true" />
          <h2>No sample services match</h2>
          <p>Try a different skill or category.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export function OpportunityExplorer({
  initialCategory,
}: {
  initialCategory: Category;
}) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      demoOpportunities.filter(
        (job) =>
          (category === "all" || job.category === category) &&
          (!query.trim() ||
            [job.title, job.summary, job.organization, ...job.skills]
              .join(" ")
              .toLowerCase()
              .includes(query.trim().toLowerCase())),
      ),
    [category, query],
  );
  return (
    <div className="market-explorer">
      <div className="market-explorer-toolbar">
        <label className="market-explorer-search">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search opportunities"
            aria-label="Search opportunities"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={17} />
            </button>
          )}
        </label>
        <Link href="/portfolio" className="market-text-link">
          Prepare your portfolio →
        </Link>
      </div>
      <div
        className="market-filter-chips"
        role="group"
        aria-label="Filter opportunities by category"
      >
        <button
          type="button"
          className={category === "all" ? "active" : ""}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          All opportunities
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? "active" : ""}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.short}
          </button>
        ))}
      </div>
      <div className="market-result-meta">
        <strong>
          {results.length}{" "}
          {results.length === 1 ? "sample opportunity" : "sample opportunities"}
        </strong>
        <span>Preview data · applications are not open</span>
      </div>
      {results.length ? (
        <div className="market-opportunity-grid">
          {results.map((job) => (
            <OpportunityCard key={job.id} opportunity={job} />
          ))}
        </div>
      ) : (
        <div className="market-explorer-empty">
          <Search size={33} aria-hidden="true" />
          <h2>No sample opportunities match</h2>
          <p>Try another search or category.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
