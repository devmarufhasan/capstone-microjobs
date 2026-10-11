import { connection } from "next/server";
import { AuthForm } from "@/components/auth-form";
import {
  authConfigured,
  emailConfigured,
  emailVerificationEnabled,
} from "@/lib/auth";
export const metadata = {
  title: "Create account",
  description: "Create your MicroJobs account to showcase your skills and connect with student opportunities.",
  robots: { index: false, follow: false },
};
export default async function Page() {
  await connection();
  return (
    <AuthForm
      mode="register"
      configured={authConfigured()}
      emailAvailable={emailConfigured()}
      verificationEnabled={emailVerificationEnabled()}
    />
  );
}
