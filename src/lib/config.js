/**
 * The single place the backend origin is defined for the public site.
 *
 * This replaces the old `next.config.js` `env.server` value, which resolved to
 * `http://localhost:5000` in development and to a bare DigitalOcean IP
 * (`http://159.203.131.104:5000`) in production. Both are gone: there is now one
 * backend, it is reachable over TLS, and it is named in exactly one place.
 *
 * Changing NEXT_PUBLIC_API_URL must be sufficient to point the whole site at a
 * different server. Nothing else in the codebase may name a host.
 *
 * (JavaScript rather than TypeScript because this app has no TypeScript set up —
 * the admin dashboard, which does, has the equivalent at `src/lib/config.ts`.)
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://elmazoon.runasp.net";
