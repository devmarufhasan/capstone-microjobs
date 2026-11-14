// Client-safe display helpers for Module 2 records.
export const formatTaka = (poisha: number) =>
  `৳${Math.round(poisha / 100).toLocaleString("en-BD")}`;
export const jobStatusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "Hired · in progress",
  completed: "Completed",
  cancelled: "Closed",
};
export const applicationStatusLabel: Record<string, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};
export const locationLabel = (type: string, location: string | null) =>
  type === "remote"
    ? "Remote"
    : `${type === "onsite" ? "On-site" : "Hybrid"}${location ? ` · ${location}` : ""}`;
export const formatDate = (value: string | Date) =>
  new Date(
    typeof value === "string" && value.length === 10
      ? `${value}T00:00:00Z`
      : value,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
