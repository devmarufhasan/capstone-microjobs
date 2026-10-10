import { connection } from "next/server";
import { AuthForm } from "@/components/auth-form";
import { authConfigured, emailConfigured } from "@/lib/auth";
export const metadata = { title: "Password recovery" };
export default async function Page() {
  await connection();
  return (
    <AuthForm
      mode="forgot"
      configured={authConfigured()}
      emailAvailable={emailConfigured()}
    />
  );
}
