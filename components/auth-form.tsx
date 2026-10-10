"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Field, Feedback, SubmitButton } from "./ui";
import { message } from "@/lib/client";
export function AuthForm({
  mode,
  token,
  configured,
  emailAvailable = true,
  verificationEnabled = true,
  invalidToken = false,
  returnTo,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  token?: string;
  configured: boolean;
  emailAvailable?: boolean;
  verificationEnabled?: boolean;
  invalidToken?: boolean;
  returnTo?: "/admin";
}) {
  const needsEmail =
    mode === "forgot" || (mode === "register" && verificationEnabled);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const router = useRouter();
  const title = {
    login: returnTo === "/admin" ? "Administrator sign in" : "Welcome back",
    register: "Create your account",
    forgot: "Forgot your password?",
    reset: "Choose a new password",
  }[mode];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget),
      email = String(form.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password = String(form.get("password") ?? "");
    try {
      if (
        (mode === "register" || mode === "reset") &&
        password !== form.get("confirmPassword")
      )
        throw new Error("Passwords do not match.");
      if (mode === "register") {
        const result = await authClient.signUp.email({
          name: String(form.get("name")).trim(),
          email,
          password,
          preferredMode: form.get("preferredMode") as "student" | "employer",
          ...(verificationEnabled ? { callbackURL: "/login?verified=1" } : {}),
        });
        if (result.error)
          throw new Error(result.error.message ?? "Registration failed.");
        if (verificationEnabled)
          setSuccess(
            "Check your inbox for a verification link. Verify your email, then log in.",
          );
        else {
          router.push("/dashboard");
          router.refresh();
        }
      } else if (mode === "login") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error)
          throw new Error(
            result.error.code === "EMAIL_NOT_VERIFIED"
              ? emailAvailable
                ? "Verify your email before logging in. Use the link below to resend it."
                : "Verify your email before logging in. Verification emails are unavailable until email delivery is configured."
              : "Unable to sign in. Check your email and password, or try again later.",
          );
        router.push(returnTo ?? "/dashboard");
        router.refresh();
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });
        if (result.error)
          throw new Error(
            "Password recovery is temporarily unavailable. Please try again.",
          );
        setSuccess(
          "If an account exists for this email, a password reset link will arrive shortly.",
        );
      } else {
        if (!token || invalidToken)
          throw new Error(
            "This reset link is invalid or expired. Request a new link.",
          );
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error)
          throw new Error(
            "This reset link is invalid or expired. Request a new link.",
          );
        setSuccess(
          "Password updated. You can now log in with your new password.",
        );
      }
    } catch (error) {
      setError(message(error));
    } finally {
      setPending(false);
    }
  }
  async function resend(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const email = String(new FormData(form!).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/login?verified=1",
      });
      if (result.error)
        throw new Error("Unable to send a link. Please try again shortly.");
      setSuccess(
        "If verification is needed, a new link will arrive in your inbox.",
      );
    } catch (error) {
      setError(message(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel auth-card">
      <h1>{title}</h1>
      <p className="muted small" style={{ marginTop: 10 }}>
        {mode === "register"
          ? "A fresh start for your skills and ambitions."
          : mode === "login"
            ? returnTo === "/admin"
              ? "Sign in with your administrator account to open the control panel."
              : "Your next chapter is right where you left it."
            : "We’ll help you get back to your account."}
      </p>
      {!configured && (
        <p className="feedback error" role="status" style={{ marginTop: 20 }}>
          Account services are not available yet. Please try again later.
        </p>
      )}
      {configured && needsEmail && !emailAvailable && (
        <p className="feedback error" role="status" style={{ marginTop: 20 }}>
          Email delivery is not available yet.{" "}
          {mode === "forgot" ? "Password recovery" : "Registration"} will open
          after email setup.
        </p>
      )}
      {mode === "register" && !verificationEnabled && (
        <p className="muted small" style={{ marginTop: 16 }}>
          Email verification is currently paused. You can use your account right
          after registration.
        </p>
      )}
      {invalidToken && (
        <p className="feedback error">
          This link is invalid or expired.{" "}
          <Link href="/forgot-password">Request a new link</Link>.
        </p>
      )}
      <form className="stack" onSubmit={submit}>
        {mode === "register" && (
          <>
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              isRequired
            />
            <label className="field">
              <span>I’m here as a</span>
              <select className="native-select" name="preferredMode">
                <option value="student">Student — showcase my work</option>
                <option value="employer">Employer — discover talent</option>
              </select>
              <span className="muted small">You can switch modes anytime.</span>
            </label>
          </>
        )}
        {mode !== "reset" && (
          <Field
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            isRequired
          />
        )}
        {mode !== "forgot" && (
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={mode === "login" ? undefined : 10}
            maxLength={128}
            isRequired
            hint={mode === "login" ? undefined : "Use at least 10 characters."}
          />
        )}
        {(mode === "register" || mode === "reset") && (
          <Field
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            isRequired
            minLength={10}
            maxLength={128}
          />
        )}
        {mode === "login" && verificationEnabled && (
          <Link
            href="/forgot-password"
            className="small"
            style={{ textAlign: "right", color: "#126956" }}
          >
            Forgot password?
          </Link>
        )}
        <Feedback error={error} success={success} />
        <SubmitButton
          pending={pending}
          isDisabled={
            !configured || invalidToken || (needsEmail && !emailAvailable)
          }
          fullWidth
        >
          {mode === "login"
            ? "Log in"
            : mode === "register"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Update password"}
        </SubmitButton>
        {mode === "login" && (
          <button
            type="button"
            className="small muted"
            disabled={pending || !configured || !emailAvailable}
            onClick={resend}
          >
            {emailAvailable
              ? "Need a new email verification link?"
              : "Verification email is not available yet"}
          </button>
        )}
      </form>
      <footer className="muted">
        {mode === "register" ? (
          <>
            Already a member? <Link href="/login">Log in</Link>
          </>
        ) : mode === "login" ? (
          <>
            New to MicroJobs? <Link href="/register">Create an account</Link>
          </>
        ) : (
          <Link href="/login">Back to login</Link>
        )}
      </footer>
    </section>
  );
}
