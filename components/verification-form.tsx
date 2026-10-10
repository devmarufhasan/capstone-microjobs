"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message, upload } from "@/lib/client";
import { Field, Feedback, SubmitButton } from "./ui";
export function VerificationForm({ storage }: { storage: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const form = new FormData(event.currentTarget);
        try {
          const file = form.get("file");
          if (!(file instanceof File) || !file.size)
            throw new Error("Choose an image of your university ID.");
          const media = await upload(file, "university_id");
          await api("/api/verification/student-id", {
            method: "POST",
            body: JSON.stringify({
              university: form.get("university"),
              mediaId: media.id,
              consent: form.get("consent") === "on",
            }),
          });
          router.refresh();
        } catch (error) {
          setError(message(error));
        } finally {
          setPending(false);
        }
      }}
    >
      <Field
        label="University name"
        name="university"
        minLength={3}
        maxLength={160}
        isRequired
      />
      <label className="field">
        <span>University ID image</span>
        <input
          className="file-input"
          type="file"
          name="file"
          accept="image/jpeg,image/png"
          required
          disabled={pending || !storage}
        />
        <span className="small muted">
          Clear JPEG or PNG, up to 5 MB. Your name and institution must be
          readable.
        </span>
      </label>
      <p className="muted small">
        Your ID is private. Only you and authorized administrators can access
        it. It is retained for review and audit; contact the platform team for
        deletion requests.
      </p>
      <label className="row small">
        <input type="checkbox" name="consent" required /> I consent to my
        university ID being reviewed and retained for verification.
      </label>
      <Feedback error={error} />
      {!storage && (
        <p className="feedback error">
          Document uploads are temporarily unavailable. Please try again later.
        </p>
      )}
      <SubmitButton pending={pending} isDisabled={!storage}>
        Submit for review
      </SubmitButton>
    </form>
  );
}
