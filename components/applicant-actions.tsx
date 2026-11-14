"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { ConfirmDialog } from "./confirm-dialog";
import { Button, Feedback } from "./ui";

/** Module 2 · Hire Students: employer shortlists, rejects or hires an applicant. */
export function ApplicantActions({
  applicationId,
  status,
  studentName,
}: {
  applicationId: string;
  status: string;
  studentName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"hire" | "rejected" | null>(null);
  if (!["submitted", "shortlisted"].includes(status)) return null;
  async function run(url: string, body?: unknown) {
    setPending(true);
    setError("");
    try {
      await api(url, {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      setConfirm(null);
      router.refresh();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <div className="row">
        <Button
          size="sm"
          isDisabled={pending}
          onPress={() => setConfirm("hire")}
        >
          Hire {studentName.split(" ")[0]}
        </Button>
        {status === "submitted" && (
          <Button
            size="sm"
            variant="secondary"
            isDisabled={pending}
            onPress={() =>
              run(`/api/applications/${applicationId}/decision`, {
                decision: "shortlisted",
              })
            }
          >
            Shortlist
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          isDisabled={pending}
          onPress={() => setConfirm("rejected")}
        >
          Decline
        </Button>
      </div>
      <Feedback error={error} />
      {confirm && (
        <ConfirmDialog
          title={
            confirm === "hire"
              ? `Hire ${studentName}?`
              : "Decline this application?"
          }
          description={
            confirm === "hire"
              ? "The job moves to in progress at the student's proposed price. All other active applications will be declined automatically."
              : "The student will see that they were not selected."
          }
          pending={pending}
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            confirm === "hire"
              ? run(`/api/applications/${applicationId}/hire`)
              : run(`/api/applications/${applicationId}/decision`, {
                  decision: "rejected",
                })
          }
        />
      )}
    </div>
  );
}

export function CloseJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button size="sm" variant="secondary" onPress={() => setOpen(true)}>
        Close job
      </Button>
      <Feedback error={error} />
      {open && (
        <ConfirmDialog
          title="Close this job?"
          description="It stops accepting applications and every pending applicant is declined. This cannot be undone."
          pending={pending}
          onClose={() => setOpen(false)}
          onConfirm={async () => {
            setPending(true);
            setError("");
            try {
              await api(`/api/jobs/${jobId}`, { method: "DELETE" });
              setOpen(false);
              router.refresh();
            } catch (cause) {
              setError(message(cause));
            } finally {
              setPending(false);
            }
          }}
        />
      )}
    </>
  );
}
