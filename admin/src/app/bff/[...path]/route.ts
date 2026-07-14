import { NextRequest } from "next/server";
import { API_BASE_URL, BFF_PREFIX } from "@/lib/config";

/**
 * Backend-for-frontend proxy.
 *
 * The browser calls this app's own origin; this handler calls the API from the
 * server. Two problems disappear as a result:
 *
 *  1. CORS. The API allow-lists the public site's origin only — a credentialed
 *     request from `localhost` gets no `Access-Control-*` headers back and never
 *     leaves the preflight. Server-to-server calls are not subject to CORS at all.
 *
 *  2. Cookies. Auth is an HttpOnly `jwt` cookie plus a `refresh_token` cookie.
 *     Because the browser now talks to its own origin, those are first-party
 *     cookies, so no SameSite/third-party-cookie policy can strip them — and they
 *     stay HttpOnly, so no JWT is ever exposed to JavaScript.
 *
 * The proxy is transparent: it forwards method, path, query, body and headers,
 * and returns the upstream status and body unchanged.
 */

export const runtime = "nodejs";
// Auth state must never be cached, and neither must dashboard figures.
export const dynamic = "force-dynamic";

/** Hop-by-hop and connection-specific headers must not be forwarded. */
const STRIP_FROM_REQUEST = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "transfer-encoding",
  "upgrade",
  // Next adds these; upstream has no use for them.
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
]);

const STRIP_FROM_RESPONSE = new Set([
  // fetch has already decompressed the body; forwarding the encoding header
  // would make the browser try to decompress plain bytes and fail.
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  // Ours to decide, not upstream's — and upstream's CSP is `default-src 'none'`,
  // which would blank the dashboard if it were applied to an HTML response.
  "content-security-policy",
  "set-cookie",

  /**
   * The API answers its GETs with `Cache-Control: public, max-age=30`.
   *
   * That header is written for the *public* site, where a 30-second cache is
   * exactly right. Forwarded to the admin it is a bug with teeth: the browser
   * caches the questions list, and when a mutation invalidates the query and
   * React Query refetches, the browser answers the refetch out of its own cache
   * with the body from *before* the write. The optimistic update is then
   * overwritten by that stale body — the answered question flips back to
   * "بانتظار الرد", the reply vanishes from under the comment — and it stays
   * wrong for up to thirty seconds.
   *
   * It was intermittent, which is what made it nasty: whether the refetch hit a
   * cached body depended on how long the list had been sitting on screen.
   *
   * `public` also means a shared cache is free to store an authenticated admin's
   * data. Both problems die with the header, replaced below by `no-store`.
   */
  "cache-control",
  "expires",
  "pragma",
  "age",
  // Without a freshness lifetime these can only serve a conditional revalidation
  // that `no-store` has already ruled out.
  "etag",
  "last-modified",
]);

/**
 * A cookie set by the API is scoped to the API's host and paths. Rebind it to
 * this origin, or the browser silently drops it and the user can never log in.
 */
function rewriteSetCookie(value: string, isSecureRequest: boolean): string {
  const parts = value.split(";");
  const out: string[] = [parts[0]]; // name=value

  for (const raw of parts.slice(1)) {
    const attr = raw.trim();
    const name = attr.split("=")[0]!.toLowerCase();

    // Bind to whatever host is serving this proxy.
    if (name === "domain") continue;

    // The refresh cookie is scoped `Path=/api/admin`; behind the proxy that URL
    // is `/bff/api/admin`. Without this the browser would never send the refresh
    // token back and every session would die at the first token expiry.
    if (name === "path") {
      const upstreamPath = attr.slice(attr.indexOf("=") + 1) || "/";
      out.push(`Path=${upstreamPath === "/" ? BFF_PREFIX : BFF_PREFIX + upstreamPath}`);
      continue;
    }

    // A `Secure` cookie is rejected outright over plain http, which is what
    // localhost dev is. In production this request is https and Secure stays.
    if (name === "secure" && !isSecureRequest) continue;

    // SameSite=None requires Secure. Over http that pair is invalid, and the
    // whole cookie is dropped. First-party through the proxy, so Lax is correct.
    if (name === "samesite" && !isSecureRequest) {
      out.push("SameSite=Lax");
      continue;
    }

    out.push(attr);
  }

  // A cookie with no Path defaults to the request's directory — which for
  // `/bff/api/admin/login` is `/bff/api/admin`, so it would never be sent on a
  // `/bff/api/dashboard/stats` call. Pin it to the proxy root instead.
  if (!parts.slice(1).some((p) => p.trim().toLowerCase().startsWith("path="))) {
    out.push(`Path=${BFF_PREFIX}`);
  }

  return out.join("; ");
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  const search = req.nextUrl.search;
  // The one and only place a request URL is assembled. Every browser call routes
  // through here, so pointing NEXT_PUBLIC_API_URL elsewhere moves the whole app.
  const target = `${API_BASE_URL}/${path.join("/")}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_FROM_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      // Buffered rather than streamed: multipart article uploads are a few MB at
      // most, and streaming a request body requires `duplex: "half"` plus an
      // HTTP/2 upstream, which IIS here is not.
      body: hasBody ? Buffer.from(await req.arrayBuffer()) : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    // The API being unreachable is a 502 from this proxy — not a 500 from the
    // dashboard, and not a silent hang.
    return Response.json(
      {
        type: "about:blank",
        title: "Bad Gateway",
        status: 502,
        detail:
          error instanceof Error
            ? `Could not reach the API at ${API_BASE_URL}: ${error.message}`
            : `Could not reach the API at ${API_BASE_URL}.`,
        instance: `/${path.join("/")}`,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_FROM_RESPONSE.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

  /**
   * Nothing behind this proxy may be cached by anyone.
   *
   * Every response here is either an admin's private data or the state they just
   * changed, and both must be read from the server every single time. This is what
   * makes a post-mutation refetch actually reach the API instead of being answered
   * from the browser's cache with a body from before the write.
   */
  responseHeaders.set("Cache-Control", "no-store, must-revalidate");

  const isSecure =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";

  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", rewriteSetCookie(cookie, isSecure));
  }

  // Same-origin now, so the browser can read these without the API's
  // Access-Control-Expose-Headers — but keeping it correct costs nothing.
  responseHeaders.set("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages");

  // 204/304 must not carry a body.
  const empty = upstream.status === 204 || upstream.status === 304;

  return new Response(empty ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
