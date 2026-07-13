/**
 * The seeded admin account, prefilled into the login form during local development.
 *
 * `process.env.NODE_ENV` is inlined by the compiler, so in a production build this
 * collapses to `false` and the whole branch — strings included — is dropped from the
 * bundle. That is what keeps the password out of anything we ship, so the constant
 * must stay a direct `process.env.NODE_ENV` comparison: read it through a variable,
 * a helper, or a runtime flag and the elimination silently stops happening.
 *
 * These are test-only credentials. They must never be provisioned on a real server.
 */
export const DEV_ADMIN_CREDENTIALS =
  process.env.NODE_ENV === "development"
    ? { email: "admin@almaazoon.com", password: "ChangeMe!2026" }
    : { email: "", password: "" };

/**
 * True only in development.
 *
 * Deliberately a second `process.env.NODE_ENV` comparison rather than something
 * derived from the constant above (`DEV_ADMIN_CREDENTIALS.email !== ""`). The
 * minifier folds a literal comparison to `false` and drops the code it guards; it
 * will not fold a property access, which left the guarded markup sitting in the
 * production bundle as dead weight.
 */
export const IS_DEV_PREFILL_ENABLED = process.env.NODE_ENV === "development";
