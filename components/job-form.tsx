"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { api, message } from "@/lib/client";
import { categories } from "@/lib/demo-marketplace";
import { Feedback, Field, SubmitButton } from "./ui";

export type JobFormValues = {
  id?: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetTaka: number;
  deadline: string;
  locationType: "remote" | "onsite" | "hybrid";
  location: string | null;
};

/** Employer job composer (Module 2 · Post a Job). Creates or edits an open job. */
export function JobForm({
  initial,
  minDate,
}: {
  initial?: JobFormValues;
  minDate: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [locationType, setLocationType] = useState(
    initial?.locationType ?? "remote",
  );
  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Job details</p>
          <h2>{initial ? "Edit your job" : "Describe the task"}</h2>
        </div>
        <div className="icon-tile">
          <FilePlus2 size={20} aria-hidden="true" />
        </div>
      </div>
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const form = new FormData(event.currentTarget);
          const text = (name: string) => String(form.get(name) ?? "").trim();
          try {
            const saved = await api<{ id: string }>(
              initial?.id ? `/api/jobs/${initial.id}` : "/api/jobs",
              {
                method: initial?.id ? "PATCH" : "POST",
                body: JSON.stringify({
                  title: text("title"),
                  description: text("description"),
                  category: text("category"),
                  skills: text("skills")
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                  budgetTaka: Number(text("budgetTaka")),
                  deadline: text("deadline"),
                  locationType,
                  location: locationType === "remote" ? "" : text("location"),
                }),
              },
            );
            router.push(`/jobs/${saved.id}`);
            router.refresh();
          } catch (cause) {
            setError(message(cause));
            setPending(false);
          }
        }}
      >
        <Field
          label="Job title"
          name="title"
          isRequired
          minLength={5}
          maxLength={120}
          defaultValue={initial?.title}
          hint="For example: “Design a poster for our campus book fair”"
        />
        <label className="field">
          <span>Category</span>
          <select
            name="category"
            className="native-select"
            defaultValue={initial?.category ?? "design"}
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Description"
          name="description"
          multiline
          isRequired
          minLength={20}
          maxLength={5000}
          defaultValue={initial?.description}
          hint="What should be delivered, and what does a good result look like?"
        />
        <Field
          label="Required skills"
          name="skills"
          isRequired
          maxLength={330}
          defaultValue={initial?.skills.join(", ")}
          hint="Separate up to 10 skills with commas."
        />
        <div className="grid-two">
          <Field
            label="Budget (BDT)"
            name="budgetTaka"
            type="number"
            isRequired
            defaultValue={initial ? String(initial.budgetTaka) : undefined}
            hint="Whole taka, from ৳100."
          />
          <label className="field">
            <span>Deadline</span>
            <input
              className="native-select"
              type="date"
              name="deadline"
              required
              min={minDate}
              defaultValue={initial?.deadline}
            />
          </label>
        </div>
        <div className="grid-two">
          <label className="field">
            <span>Work location</span>
            <select
              className="native-select"
              value={locationType}
              onChange={(event) =>
                setLocationType(event.target.value as typeof locationType)
              }
            >
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          {locationType !== "remote" && (
            <Field
              label="Location"
              name="location"
              isRequired
              maxLength={160}
              defaultValue={initial?.location ?? ""}
              hint="Area or campus, e.g. Dhanmondi, Dhaka"
            />
          )}
        </div>
        <Feedback error={error} />
        <SubmitButton pending={pending}>
          {initial ? "Save changes" : "Publish job"}
        </SubmitButton>
      </form>
    </section>
  );
}
