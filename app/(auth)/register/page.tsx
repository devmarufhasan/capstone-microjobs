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
  title: "Create account",
  description: "Create your MicroJobs account to showcase your skills and connect with student opportunities.",
};
export default async function Page() {
  await connection();
  const actor = await currentUser();
  if (actor)
    redirect(actor.accessLevel === "administrator" ? "/admin" : "/dashboard");
  return (
    <AuthForm
      mode="register"
      configured={authConfigured()}
      emailAvailable={emailConfigured()}
      verificationEnabled={emailVerificationEnabled()}
    />
  );
}
