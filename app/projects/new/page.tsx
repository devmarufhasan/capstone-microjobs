import { redirect } from "next/navigation";
// The former preview composer is now the real job form (Module 2).
export default function Page() {
  redirect("/jobs/new");
}
