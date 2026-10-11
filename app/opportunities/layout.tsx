import { redirectAdminFromMarketplace } from "@/lib/http";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectAdminFromMarketplace();
  return children;
}
