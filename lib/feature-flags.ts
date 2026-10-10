// Only the explicit value "true" enables this optional trust check.
// A missing flag keeps local development usable before email delivery is set up.
export function emailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED === "true";
}
