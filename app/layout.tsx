import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "MicroJobs — Small work. Real beginnings.",
    template: "%s | MicroJobs",
  },
  description:
    "Build your profile, verify your student identity, and showcase your work on MicroJobs.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense
          fallback={
            <main className="page" role="status">
              Loading MicroJobs…
            </main>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
