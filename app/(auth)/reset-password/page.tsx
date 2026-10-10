import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/auth";
export const metadata = { title: "Reset password" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return (
    <AuthForm
      mode="reset"
      token={token}
      invalidToken={!token || !!error}
      configured={authConfigured()}
    />
  );
}
