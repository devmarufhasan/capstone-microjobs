"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { api, message } from "@/lib/client";
import { ConfirmDialog } from "./confirm-dialog";
import { Button, Feedback, Field, SubmitButton } from "./ui";

export type ApplicationValues = {
  id: string;
  message: string;
  proposedPriceTaka: number;
  deliveryDays: number;
  approach: string;
  suitability: string;
  status: string;
};

/**
 * Module 2 · Apply for Jobs + Job Proposal System.
 * A quick application (message, price, delivery time) with an optional
 * customized proposal (approach, suitability). Also edits/withdraws an
 * active proposal.
 */
export function ApplicationForm({
  jobId,
  budgetTaka,
  existing,
}: {
  jobId: string;
  budgetTaka: number;
  existing?: ApplicationValues | null;
}) {
  const router = useRouter();
  const editable =
    !existing || ["submitted", "shortlisted"].includes(existing.status);
  const [editing, setEditing] = useState(
    !existing || existing.status === "withdrawn",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const resubmit = existing?.status === "withdrawn";

  if (existing && !editing)
    return (
      <div className="stack">
        <Feedback error={error} success={success} />
        <p className="small muted">
          Your proposal: ৳{existing.proposedPriceTaka.toLocaleString("en-BD")} ·{" "}
          {existing.deliveryDays} day{existing.deliveryDays === 1 ? "" : "s"}
        </p>
        {editable && (
          <div className="row">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setEditing(true)}
            >
              Edit proposal
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setConfirmWithdraw(true)}
            >
              Withdraw
            </Button>
          </div>
        )}
        {confirmWithdraw && (
          <ConfirmDialog
            title="Withdraw this proposal?"
            description="The employer will no longer see it. You can resubmit while the job is open."
            pending={pending}
            onClose={() => setConfirmWithdraw(false)}
            onConfirm={async () => {
              setPending(true);
              setError("");
              try {
                await api(`/api/applications/${existing.id}`, {
                  method: "DELETE",
                });
                setConfirmWithdraw(false);
                router.refresh();
              } catch (cause) {
                setError(message(cause));
              } finally {
                setPending(false);
              }
            }}
          />
        )}
      </div>
    );

  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");
        const form = new FormData(event.currentTarget);
        const text = (name: string) => String(form.get(name) ?? "").trim();
        const body = JSON.stringify({
          message: text("message"),
          proposedPriceTaka: Number(text("proposedPriceTaka")),
          deliveryDays: Number(text("deliveryDays")),
          approach: text("approach"),
          suitability: text("suitability"),
        });
        try {
          if (existing && !resubmit)
            await api(`/api/applications/${existing.id}`, {
              method: "PATCH",
              body,
            });
          else
            await api(`/api/jobs/${jobId}/applications`, {
              method: "POST",
              body,
            });
          setSuccess(
            existing && !resubmit
              ? "Proposal updated."
              : "Application sent to the employer.",
          );
          setEditing(false);
          router.refresh();
        } catch (cause) {
          setError(message(cause));
        } finally {
          setPending(false);
        }
      }}
    >
      <Field
        label="Short message to the employer"
        name="message"
        multiline
        isRequired
        minLength={20}
        maxLength={1500}
        defaultValue={existing?.message}
        hint="Introduce yourself and confirm you understand the task."
      />
      <div className="grid-two">
        <Field
          label="Your price (BDT)"
          name="proposedPriceTaka"
          type="number"
          isRequired
          defaultValue={String(existing?.proposedPriceTaka ?? budgetTaka)}
        />
        <Field
          label="Delivery time (days)"
          name="deliveryDays"
          type="number"
          isRequired
          defaultValue={String(existing?.deliveryDays ?? 3)}
        />
      </div>
      <Field
        label="Your approach (proposal)"
        name="approach"
        multiline
        maxLength={3000}
        defaultValue={existing?.approach}
        hint="Optional: how you will complete the work, step by step."
      />
      <Field
        label="Why you are a good fit"
        name="suitability"
        multiline
        maxLength={2000}
        defaultValue={existing?.suitability}
        hint="Optional: relevant skills, coursework or portfolio pieces."
      />
      <Feedback error={error} success={success} />
      <div className="row">
        <SubmitButton pending={pending}>
          <Send size={16} aria-hidden="true" />
          {existing && !resubmit ? "Save proposal" : "Send application"}
        </SubmitButton>
        {existing && !resubmit && (
          <Button
            variant="secondary"
            onPress={() => setEditing(false)}
            isDisabled={pending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
