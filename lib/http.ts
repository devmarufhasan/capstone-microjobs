import "server-only";
import { DomainError } from "./services";
import { ZodError, type ZodType } from "zod";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth, authConfigured } from "./auth";
import { getDb } from "./db";
import { user } from "./db/schema";
import { isAdmin } from "./policy";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function currentUser(requestHeaders?: Headers) {
  if (!authConfigured()) return null;
  const authSession = await getAuth().api.getSession({
    headers: requestHeaders ?? (await headers()),
  });
  if (!authSession) return null;
  const [record] = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, authSession.user.id));
  return record?.status === "active" ? record : null;
}
export async function requireUser(request?: Request, admin = false) {
  const actor = await currentUser(request?.headers);
  if (!actor) throw new HttpError(401, "Please sign in to continue.");
  if (admin && !isAdmin(actor))
    throw new HttpError(403, "Administrator access required.");
  return actor;
}
export async function pageUser(admin = false) {
  await connection();
  if (!authConfigured()) redirect("/setup");
  const actor = await currentUser();
  if (!actor) redirect(admin ? "/login?next=/admin" : "/login");
  if (admin && !isAdmin(actor)) redirect("/unauthorized");
  return actor;
}
export async function requireMember(request?: Request) {
  const actor = await requireUser(request);
  if (isAdmin(actor))
    throw new HttpError(
      403,
      "Administrator accounts cannot use student or employer features.",
    );
  return actor;
}
export async function pageMember() {
  const actor = await pageUser();
  if (isAdmin(actor)) redirect("/admin");
  return actor;
}
export async function redirectAdminFromMarketplace() {
  await connection();
  const actor = await currentUser();
  if (actor && isAdmin(actor)) redirect("/admin");
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
  )
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function parseBody<T>(request: Request, validator: ZodType<T>) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Expected JSON.");
  const raw = await request.text();
  if (raw.length > 32_000) throw new HttpError(413, "Request is too large.");
  try {
    return validator.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new HttpError(400, "Invalid JSON.");
  }
}
export async function route(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof HttpError || error instanceof DomainError)
      return Response.json(
        { error: { message: error.message } },
        { status: error.status },
      );
    if (error instanceof ZodError)
      return Response.json(
        {
          error: {
            message: error.issues[0]?.message ?? "Invalid input.",
            fieldErrors: error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    const code =
      (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
      (error as { code?: string })?.code;
    if (code === "23505")
      return Response.json(
        {
          error: {
            message:
              "This record already exists or has already been submitted.",
          },
        },
        { status: 409 },
      );
    console.error("module_one_request_failed", { code: code ?? "unknown" });
    return Response.json(
      {
        error: {
          message: "The service is temporarily unavailable. Please try again.",
        },
      },
      { status: 503 },
    );
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
