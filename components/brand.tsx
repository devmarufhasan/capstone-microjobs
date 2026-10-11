import Link from "next/link";
import { Suspense, cache } from "react";
import { connection } from "next/server";
import { ArrowUpRight, Search } from "lucide-react";
import { currentUser } from "@/lib/http";
import { AccountToolbox } from "./account-toolbox";
import { categories } from "@/lib/demo-marketplace";

const publicActor = cache(async () => {
  await connection();
  return currentUser();
});

async function HeaderAccountActions() {
  const actor = await publicActor();
  return (
    <nav aria-label="Main navigation">
      {actor ? (
        <AccountToolbox
          account={{
            name: actor.name,
            email: actor.email,
            image: actor.image,
            accessLevel: actor.accessLevel,
            preferredMode: actor.preferredMode,
          }}
        />
      ) : (
        <>
          <Link href="/login">Log in</Link>
          <Link className="link-button" href="/register">
            Get started
          </Link>
        </>
      )}
    </nav>
  );
}

export async function HomeStartLink({
  className,
  guestLabel,
}: {
  className: string;
  guestLabel: string;
}) {
  const actor = await publicActor();
  const destination = actor
    ? actor.accessLevel === "administrator"
      ? "/admin"
      : "/dashboard"
    : "/register";
  return (
    <Link className={className} href={destination}>
      {actor
        ? actor.accessLevel === "administrator"
          ? "Open admin panel"
          : "Open dashboard"
        : guestLabel}
      <ArrowUpRight size={19} aria-hidden="true" />
    </Link>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true">
        m
      </span>
      <span className="brand-wordmark">
        microjobs<span style={{ color: "#409d77" }}>.</span>
      </span>
    </Link>
  );
}
export function PublicHeader({
  marketplace = false,
}: {
  marketplace?: boolean;
}) {
  return (
    <>
      <header
        className={`site-header ${marketplace ? "marketplace-site-header" : ""}`}
      >
        <Brand />
        {marketplace && (
          <form
            action="/explore"
            className="market-header-search"
            role="search"
          >
            <Search size={18} aria-hidden="true" />
            <input
              name="q"
              type="search"
              placeholder="Search student services"
              aria-label="Search student services"
            />
            <button type="submit" aria-label="Search">
              <Search size={17} aria-hidden="true" />
            </button>
          </form>
        )}
        <div className="site-header-right">
          {marketplace && (
            <nav className="market-header-links" aria-label="Marketplace">
              <Link href="/explore">Explore services</Link>
              <Link href="/opportunities">Find work</Link>
              <Link href="/projects/new">Post a project</Link>
            </nav>
          )}
          <Suspense
            fallback={
              <div
                className="site-header-actions-placeholder"
                aria-hidden="true"
              />
            }
          >
            <HeaderAccountActions />
          </Suspense>
        </div>
      </header>
      {marketplace && (
        <nav className="market-category-bar" aria-label="Service categories">
          <div>
            <Link href="/opportunities">Find work · preview</Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/explore?category=${category.id}`}>
                {category.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
