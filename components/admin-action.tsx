"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { Button, Feedback } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
export function AdminAction({
  id,
  kind,
  status,
}: {
  id: string;
  kind: "user" | "verification";
  status?: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<string | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <div className="row">
        {kind === "user" ? (
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              setAction(status === "suspended" ? "active" : "suspended")
            }
          >
            {status === "suspended" ? "Restore" : "Suspend"}
          </Button>
        ) : (
          <>
            <Button size="sm" onPress={() => setAction("approved")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setAction("rejected")}
            >
              Reject
            </Button>
          </>
        )}
      </div>
      <Feedback error={error} />
      {action && (
        <ConfirmDialog
          title={
            kind === "user"
              ? action === "suspended"
                ? "Suspend this account?"
                : "Restore this account?"
              : action === "approved"
                ? "Approve student identity?"
                : "Reject this submission?"
          }
          description={
            kind === "user"
              ? "This action is recorded in the audit log. Suspension also signs the user out of their sessions."
              : "Review the evidence before deciding. This decision is recorded and cannot be edited. The applicant will see your reason."
          }
          pending={pending}
          reason
          onClose={() => setAction(null)}
          onConfirm={async (reason) => {
            setPending(true);
            setError("");
            try {
              await api(
                `/api/admin/${kind === "user" ? "users" : "verification"}/${id}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(
                    kind === "user"
                      ? { status: action, reason }
                      : { decision: action, reason },
                  ),
                },
              );
              setAction(null);
              router.refresh();
            } catch (error) {
              setError(message(error));
              setAction(null);
            } finally {
              setPending(false);
            }
          }}
        />
      )}
    </>
  );
}
