"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Dropdown } from "@heroui/react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Flag,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldCheck,
  UserRound,
  Search,
  Compass,
  FilePlus2,
  MessagesSquare,
  PackageCheck,
  Layers3,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Account = {
  name: string;
  email: string;
  image: string | null;
  accessLevel: "user" | "administrator";
  preferredMode: "student" | "employer";
};

function AccountAvatar({
  account,
  large = false,
}: {
  account: Account;
  large?: boolean;
}) {
  return (
    <Avatar className={`account-avatar ${large ? "account-avatar-large" : ""}`}>
      {account.image && <Avatar.Image src={account.image} alt="" />}
      <Avatar.Fallback>
        {account.name.trim().slice(0, 1).toUpperCase()}
      </Avatar.Fallback>
    </Avatar>
  );
}

export function AccountToolbox({ account }: { account: Account }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "explore",
      label: "Explore services",
      href: "/explore",
      icon: Search,
    },
    {
      id: "opportunities",
      label: "Find work · preview",
      href: "/opportunities",
      icon: Compass,
    },
    { id: "services", label: "My services · preview", href: "/seller/services", icon: Layers3 },
    { id: "post-project", label: "Post a project · preview", href: "/projects/new", icon: FilePlus2 },
    { id: "orders", label: "Orders · preview", href: "/orders", icon: PackageCheck },
    { id: "messages", label: "Messages · preview", href: "/messages", icon: MessagesSquare },
    { id: "profile", label: "My profile", href: "/profile", icon: UserRound },
    {
      id: "portfolio",
      label: "My portfolio",
      href: "/portfolio",
      icon: BriefcaseBusiness,
    },
    {
      id: "verification",
      label: "Verification",
      href: "/verification",
      icon: ShieldCheck,
    },
    { id: "cases", label: "My cases", href: "/cases", icon: Flag },
    ...(account.accessLevel === "administrator"
      ? [{ id: "admin", label: "Admin panel", href: "/admin", icon: Settings2 }]
      : []),
  ];

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Unable to log out.");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not log out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="account-toolbox">
      <Dropdown>
        <Dropdown.Trigger
          className="account-toolbox-trigger"
          aria-label={`Open account menu for ${account.name}`}
          isDisabled={pending}
        >
          <AccountAvatar account={account} />
          <span className="account-toolbox-trigger-name">
            {account.name.split(" ")[0]}
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </Dropdown.Trigger>
        <Dropdown.Popover
          placement="bottom end"
          className="account-toolbox-popover"
        >
          <div className="account-toolbox-identity">
            <AccountAvatar account={account} large />
            <div className="account-toolbox-identity-copy">
              <strong>{account.name}</strong>
              <span>{account.email}</span>
              <small>
                {account.accessLevel === "administrator"
                  ? "Administrator"
                  : account.preferredMode === "student"
                    ? "Student mode"
                    : "Employer mode"}
              </small>
            </div>
          </div>
          <Dropdown.Menu
            aria-label="Account options"
            className="account-toolbox-menu"
          >
            {items.map(({ id, label, href, icon: Icon }) => (
              <Dropdown.Item
                key={id}
                id={id}
                textValue={label}
                className="account-toolbox-item"
                onAction={() => router.push(href)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </Dropdown.Item>
            ))}
            <Dropdown.Item
              id="logout"
              textValue="Log out"
              className="account-toolbox-item account-toolbox-logout"
              onAction={signOut}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>{pending ? "Logging out…" : "Log out"}</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {error && (
        <span className="account-toolbox-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
