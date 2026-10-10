"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  ShieldCheck,
  BriefcaseBusiness,
  Settings2,
  Flag,
  Search,
  Compass,
} from "lucide-react";
export function WorkspaceNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Workspace">
      {[
        ["/dashboard", "Overview", LayoutDashboard],
        ["/explore", "Explore services", Search],
        ["/opportunities", "Find work · preview", Compass],
        ["/profile", "My profile", UserRound],
        ["/verification", "Verification", ShieldCheck],
        ["/portfolio", "My portfolio", BriefcaseBusiness],
        ["/cases", "My cases", Flag],
        ...(admin ? [["/admin", "Administration", Settings2]] : []),
      ].map(([href, label, Icon]) => {
        const Component = Icon as typeof LayoutDashboard;
        return (
          <Link
            href={String(href)}
            key={String(href)}
            aria-current={path === href ? "page" : undefined}
            className={`nav-link ${path === href || (href === "/admin" && path.startsWith("/admin")) ? "active" : ""}`}
          >
            <Component size={19} aria-hidden="true" />
            <span>{String(label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
