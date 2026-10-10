import {
  getAuth,
  authConfigured,
  emailConfigured,
  emailVerificationEnabled,
} from "@/lib/auth";
async function handle(request: Request) {
  if (!authConfigured())
    return Response.json(
      { message: "Account services are not configured yet." },
      { status: 503 },
    );
  const path = new URL(request.url).pathname;
  if (!emailVerificationEnabled() && path.endsWith("/send-verification-email"))
    return Response.json(
      { message: "Email verification is turned off." },
      { status: 409 },
    );
  if (
    [
      ...(emailVerificationEnabled() ? ["/sign-up/email"] : []),
      "/request-password-reset",
      "/send-verification-email",
    ].some((s) => path.endsWith(s)) &&
    !emailConfigured()
  ) {
    return Response.json(
      {
        message: "Email delivery is not available yet. Please try again later.",
      },
      { status: 503 },
    );
  }
  try {
    return await getAuth().handler(request);
  } catch {
    return Response.json(
      { message: "Account service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
export const GET = handle;
export const POST = handle;
