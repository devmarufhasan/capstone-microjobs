import { connection } from "next/server";
import { AuthForm } from "@/components/auth-form";
import {
  authConfigured,
  emailConfigured,
  emailVerificationEnabled,
} from "@/lib/auth";
export const metadata = { title: "Log in" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await connection();
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
