"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { Field, Feedback, SubmitButton } from "./ui";

export function CaseForm({
  subjectUserId,
  subjectName,
}: {
  subjectUserId: string;
  subjectName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return (
    <section className="panel stack">
      <div>
        <h2>New case about {subjectName}</h2>
        <p className="small muted">
          Use a report for a concern about this account, or a dispute for a
          disagreement with this person. Job-specific cases will be available
          when job records are connected.
        </p>
      </div>
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          setSuccess("");
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          try {
            await api("/api/cases", {
              method: "POST",
              body: JSON.stringify({
                subjectUserId,
                type: form.get("type"),
                description: form.get("description"),
              }),
            });
            formElement.reset();
            setSuccess(
              "Your case was submitted. An administrator will review it.",
            );
            router.refresh();
          } catch (cause) {
            setError(message(cause));
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field">
          <span>Case type</span>
          <select className="native-select" name="type" required>
            <option value="report">Report account</option>
            <option value="dispute">Account dispute</option>
          </select>
        </label>
        <Field
          label="Describe what happened"
          name="description"
          multiline
          isRequired
          minLength={20}
          maxLength={3000}
          hint="20–3000 characters. Do not include passwords or payment details."
        />
        <Feedback error={error} success={success} />
        <SubmitButton pending={pending}>Submit case</SubmitButton>
      </form>
    </section>
  );
}
