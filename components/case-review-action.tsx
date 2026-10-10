"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { Button, Feedback, Field, SubmitButton } from "./ui";

export function CaseReviewAction({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<
    "under_review" | "resolved" | "rejected" | null
  >(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (status === "resolved" || status === "rejected") return null;
  return (
    <div className="stack">
      <div className="row">
        {status === "open" && (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setDecision("under_review")}
          >
            Mark in review
          </Button>
        )}
        <Button size="sm" onPress={() => setDecision("resolved")}>
          Resolve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setDecision("rejected")}
        >
          Reject
        </Button>
      </div>
      {decision && (
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError("");
            const reason = new FormData(event.currentTarget).get("reason");
            try {
              await api(`/api/admin/cases/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: decision, reason }),
              });
              setDecision(null);
              router.refresh();
            } catch (cause) {
              setError(message(cause));
            } finally {
              setPending(false);
            }
          }}
        >
          <Field
            label={
              decision === "under_review" ? "Review note" : "Decision reason"
            }
            name="reason"
            multiline
            isRequired
            minLength={5}
            maxLength={1000}
          />
          <div className="row">
            <SubmitButton pending={pending}>
              Confirm {decision.replace("_", " ")}
            </SubmitButton>
            <Button
              variant="secondary"
              isDisabled={pending}
              onPress={() => setDecision(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <Feedback error={error} />
    </div>
  );
}
