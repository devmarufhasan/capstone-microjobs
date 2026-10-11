"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, message } from "@/lib/client";
import { Field, Feedback, SubmitButton } from "./ui";
export function ProfileForm({
  profile,
}: {
  profile: { name: string; bio: string; preferredMode: string; email: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setSuccess("");
        const data = new FormData(event.currentTarget);
        try {
          await api("/api/users/me", {
            method: "PATCH",
            body: JSON.stringify({
              name: data.get("name"),
              bio: data.get("bio"),
              preferredMode: data.get("preferredMode"),
            }),
          });
          setSuccess("Your profile is up to date.");
          router.refresh();
        } catch (error) {
          setError(message(error));
        } finally {
          setPending(false);
        }
      }}
    >
      <Field
        label="Full name"
        name="name"
        defaultValue={profile.name}
        minLength={2}
        maxLength={100}
        isRequired
      />
      <Field
        label="Email address"
        value={profile.email}
        isReadOnly
        hint="Your sign-in address. Email verification status appears on the verification page."
      />
      <Field
        label="About you"
        name="bio"
        defaultValue={profile.bio}
        maxLength={1000}
        multiline
        hint="Share what you’re learning, making, or looking for."
      />
      <label className="field">
        <span>Workspace mode</span>
        <select
          name="preferredMode"
          defaultValue={profile.preferredMode}
          className="native-select"
        >
          <option value="student">Student</option>
          <option value="employer">Employer</option>
        </select>
        <span className="muted small">
          Your portfolio and verification stay with you when you switch.
        </span>
      </label>
      <Feedback error={error} success={success} />
      <SubmitButton pending={pending}>Save changes</SubmitButton>
    </form>
  );
}
