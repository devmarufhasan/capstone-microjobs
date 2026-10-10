export async function api<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error?.message ??
        data.message ??
        "Something went wrong. Please try again.",
    );
  return data as T;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export async function upload(
  file: File,
  purpose: "portfolio" | "university_id",
) {
  const form = new FormData();
  form.set("file", file);
  form.set("purpose", purpose);
  return api<{ id: string }>("/api/media", { method: "POST", body: form });
}
