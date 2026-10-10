import { AdminNav } from "@/components/admin-nav";
import { pageUser } from "@/lib/http";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await pageUser(true);
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
