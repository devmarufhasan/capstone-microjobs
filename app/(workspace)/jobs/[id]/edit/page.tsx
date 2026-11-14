import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JobForm } from "@/components/job-form";
import { getDb } from "@/lib/db";
import { job } from "@/lib/db/schema";
import { pageMember } from "@/lib/http";
import { today, toTaka } from "@/lib/marketplace";
export const metadata = { title: "Edit job" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await pageMember();
  const { id } = await params;
  const [item] = await getDb().select().from(job).where(eq(job.id, id));
  if (!item || item.employerId !== actor.id) notFound();
  if (item.status !== "open") redirect(`/jobs/${id}`);
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">For employers</p>
        <h1>Edit job</h1>
      </div>
      <JobForm
        minDate={item.deadline < today() ? item.deadline : today()}
        initial={{
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          skills: item.skills,
          budgetTaka: toTaka(item.budgetPoisha),
          deadline: item.deadline,
          locationType: item.locationType,
          location: item.location,
        }}
      />
    </>
  );
}
