/**
 * The single place the backend origin is defined.
 *
 * Changing NEXT_PUBLIC_API_URL must be sufficient to point the entire dashboard
 * at a different server. Nothing else in the codebase may name a host.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://elmazoon.runasp.net";

/**
 * Where the browser sends its requests.
 *
 * Not the API. The API's CORS allow-list contains the public site's origin and
 * nothing else — from `http://localhost:3000` it returns no `Access-Control-*`
 * headers at all, so a credentialed request from a dev machine dies in the
 * preflight before it is ever sent. Auth here is an HttpOnly cookie, so no
 * client-side workaround exists.
 *
 * Instead the browser talks to this app's own origin, and the route handler at
 * `src/app/bff/[...path]/route.ts` forwards the request to API_BASE_URL from the
 * server, where CORS does not apply. Same-origin in the browser, so cookies just
 * work; HttpOnly is preserved end to end.
 */
export const BFF_PREFIX = "/bff";

/** Anything slower than this is a hung backend, not a slow one. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Uploads are legitimately slower than JSON. */
export const UPLOAD_TIMEOUT_MS = 60_000;
