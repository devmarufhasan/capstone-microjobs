import { JobForm } from "@/components/job-form";
import { pageMember } from "@/lib/http";
import { today } from "@/lib/marketplace";
export const metadata = { title: "Post a job" };
// Module 2 · Post a Job.
export default async function Page() {
  await pageMember();
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">For employers</p>
        <h1>Post a job</h1>
        <p className="muted">
          Publish a short task with a clear budget and deadline. Students can
          apply as soon as it is published.
        </p>
      </div>
      <JobForm minDate={today()} />
    </>
  );
}
