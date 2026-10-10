import { PublicHeader } from "@/components/brand";
import Image from "next/image";
import { BadgeCheck, Layers3 } from "lucide-react";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="auth-wrap">
        <section className="auth-intro">
          <p className="eyebrow">Built for what comes next</p>
          <h1>
            Your work has
            <br />a place to grow.
          </h1>
          <p className="muted">
            Show your skills, build trust, and take the next step with a
            portfolio that feels like you.
          </p>
          <div className="auth-photo">
            <Image
              src="/images/students-collaborating.webp"
              alt="University students collaborating on a laptop"
              width={1600}
              height={900}
              sizes="(max-width: 650px) 0px, 45vw"
            />
            <span>
              <BadgeCheck size={18} aria-hidden="true" /> Made for emerging
              talent
            </span>
          </div>
          <div className="auth-intro-foot">
            <Layers3 size={18} aria-hidden="true" /> One account, every side of
            your journey.
          </div>
        </section>
        {children}
      </main>
    </>
  );
}
