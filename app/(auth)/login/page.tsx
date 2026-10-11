import { connection } from "next/server";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/http";
import { AuthForm } from "@/components/auth-form";
import {
  authConfigured,
  emailConfigured,
  emailVerificationEnabled,
} from "@/lib/auth";
export const metadata = {
  title: "Log in",
  description: "Log in to your MicroJobs account to continue to your workspace.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await connection();
  const actor = await currentUser();
  if (actor)
    redirect(actor.accessLevel === "administrator" ? "/admin" : "/dashboard");
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="login"
      returnTo={next === "/admin" ? "/admin" : undefined}
      configured={authConfigured()}
      emailAvailable={emailConfigured()}
      verificationEnabled={emailVerificationEnabled()}
    />
  );
}
