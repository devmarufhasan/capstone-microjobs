import { redirectAdminFromMarketplace } from "@/lib/http";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  Layers3,
  Megaphone,
  PenLine,
  PlaySquare,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
} from "lucide-react";
import { Brand, HomeStartLink, PublicHeader } from "@/components/brand";
import { OpportunityCard, ServiceCard } from "@/components/marketplace-cards";
import {
  categories,
  demoOpportunities,
  demoServices,
} from "@/lib/demo-marketplace";

const categoryIcons = {
  design: PenLine,
  development: Code2,
  marketing: Megaphone,
  writing: Layers3,
  video: PlaySquare,
  data: Table2,
};

export default async function Home() {
  await redirectAdminFromMarketplace();
  return (
    <>
      <PublicHeader marketplace />
      <main className="market-home">
        <section className="market-hero" aria-labelledby="market-hero-title">
          <div className="market-hero-copy">
            <span className="market-hero-eyebrow">
              <Sparkles size={15} aria-hidden="true" /> A student-first
              marketplace
            </span>
            <h1 id="market-hero-title">
              Great work starts <em>with a chance.</em>
            </h1>
            <p>
              Discover emerging student talent for your next idea, or find the
              kind of small project that moves your career forward.
            </p>
            <form
              action="/explore"
              className="market-hero-search"
              role="search"
            >
              <Search size={21} aria-hidden="true" />
              <input
                name="q"
                type="search"
                aria-label="Search student services"
                placeholder="What do you need help with?"
              />
              <button type="submit">Search</button>
            </form>
            <div className="market-hero-shortcuts">
              <span>Popular:</span>
              <Link href="/explore?category=design">Graphic design</Link>
              <Link href="/explore?category=development">Websites</Link>
              <Link href="/explore?category=writing">Writing</Link>
            </div>
            <Link className="market-hero-work-link" href="/opportunities">
              Looking for student work? Explore opportunities{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="market-hero-visual">
            <Image
              src="/images/students-collaborating.webp"
              width={1600}
              height={900}
              priority
              sizes="(max-width: 850px) 100vw, 48vw"
              alt="University students collaborating over a laptop"
            />
            <div className="market-hero-photo-note">
              <span>
                <GraduationCap size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Built around student talent</strong>
                <small>Skills today. Experience tomorrow.</small>
              </div>
            </div>
          </div>
        </section>

        <section className="market-proof" aria-label="Why MicroJobs">
          <div>
            <GraduationCap size={22} aria-hidden="true" />
            <span>University student focus</span>
          </div>
          <div>
            <Layers3 size={22} aria-hidden="true" />
            <span>Real portfolios, one place</span>
          </div>
          <div>
            <ShieldCheck size={22} aria-hidden="true" />
            <span>Student ID review available</span>
          </div>
        </section>

        <section className="market-section" aria-labelledby="categories-title">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">
                Explore what students can do
              </span>
              <h2 id="categories-title">Find your starting point</h2>
            </div>
            <Link href="/explore" className="market-text-link">
              All services <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="market-category-grid">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              return (
                <Link
                  href={`/explore?category=${category.id}`}
                  className={`market-category-tile market-category-${category.id}`}
                  key={category.id}
                >
                  <Icon size={25} aria-hidden="true" />
                  <span>{category.label}</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="market-section" aria-labelledby="services-title">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">Discover student services</span>
              <h2 id="services-title">Made for your next idea</h2>
              <p>
                Browse a preview of the service marketplace. These listings are
                examples while marketplace APIs are being built.
              </p>
            </div>
            <Link href="/explore" className="market-text-link">
              Explore all <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="market-service-grid">
            {demoServices.slice(0, 4).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>

        <section className="market-student-banner">
          <div className="market-student-graphic" aria-hidden="true">
            <div className="market-student-graphic-card">
              <span className="market-student-graphic-icon">
                <BadgeCheck size={27} />
              </span>
              <span className="market-student-graphic-line" />
              <span className="market-student-graphic-line short" />
              <div className="market-student-graphic-chips">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <div>
            <span className="market-overline">
              For the student behind the skill
            </span>
            <h2>Your work deserves a storefront.</h2>
            <p>
              Build a profile, add portfolio projects and choose what to show
              publicly. Your student identity can be reviewed for a trust badge.
            </p>
            <Suspense
              fallback={
                <span className="home-action-placeholder" aria-hidden="true" />
              }
            >
              <HomeStartLink
                className="market-button market-button-light"
                guestLabel="Build your profile"
              />
            </Suspense>
          </div>
        </section>

        <section
          className="market-section market-opportunity-section"
          aria-labelledby="opportunities-title"
        >
          <div className="market-section-heading">
            <div>
              <span className="market-overline">Find a way in</span>
              <h2 id="opportunities-title">Small projects. Real momentum.</h2>
              <p>
                Sample opportunities show the future work-browsing experience.
                Applications are not open yet.
              </p>
            </div>
            <Link href="/opportunities" className="market-text-link">
              View opportunities <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="market-opportunity-grid">
            {demoOpportunities.slice(0, 3).map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </section>

        <section className="market-two-paths" aria-labelledby="paths-title">
          <div className="market-section-heading">
            <div>
              <span className="market-overline">
                One community, two ways to move
              </span>
              <h2 id="paths-title">A place for both sides of the work</h2>
            </div>
          </div>
          <div className="market-path-grid">
            <article>
              <span className="market-path-icon">
                <GraduationCap size={25} aria-hidden="true" />
              </span>
              <h3>I’m a student</h3>
              <p>
                Show your skills and portfolio, build trust and preview
                opportunities made for a first step.
              </p>
              <Link href="/opportunities">
                Explore student opportunities{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
            <article>
              <span className="market-path-icon">
                <BriefcaseBusiness size={25} aria-hidden="true" />
              </span>
              <h3>I’m looking for talent</h3>
              <p>
                See student services and public portfolios, then discover the
                person behind the work.
              </p>
              <Link href="/explore">
                Explore student services{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        <section className="market-final">
          <div>
            <span className="market-overline">
              MicroJobs is just getting started
            </span>
            <h2>Big potential starts small.</h2>
            <p>
              Create your profile today. Service listings and work applications
              shown here are a preview of upcoming marketplace modules.
            </p>
          </div>
          <Suspense
            fallback={
              <span className="home-action-placeholder" aria-hidden="true" />
            }
          >
            <HomeStartLink
              className="market-button market-button-dark"
              guestLabel="Join MicroJobs"
            />
          </Suspense>
        </section>
      </main>
      <footer className="market-footer">
        <div>
          <Brand />
          <p>A student-first space for skills, projects and possibility.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link href="/explore">Student services</Link>
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/seller/services">Student storefront</Link>
        </div>
        <div>
          <strong>MicroJobs</strong>
          <Link href="/">Home</Link>
          <Link href="/explore">Browse services</Link>
          <Link href="/projects/new">Post a project</Link>
        </div>
        <span>© MicroJobs</span>
      </footer>
    </>
  );
}
