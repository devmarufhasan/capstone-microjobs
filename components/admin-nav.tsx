"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/verification", "Student verification"],
  ["/admin/reports", "Reports"],
  ["/admin/disputes", "Disputes"],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="row small admin-nav" aria-label="Administration">
      {items.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className="badge"
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
