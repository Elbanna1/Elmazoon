import { API_BASE_URL } from '@/lib/config';

/**
 * Backend-for-frontend proxy for the public site.
 *
 * Every browser-side call the public site makes — submitting a question, posting
 * a comment, loading "أسئلتي", recording a visit — used to go straight from the
 * browser to the API. That works only from an origin the backend's CORS policy
 * allow-lists, and its list contains `https://almaazoon.com` and
 * `http://localhost:3000` and nothing else.
 *
 * On `https://elmazoon.vercel.app` the browser therefore received no
 * `Access-Control-Allow-Origin` header, blocked the request before it was sent,
 * and axios saw no response at all — which surfaced to the visitor as
 * "تعذّر الوصول إلى الخادم". Reads still worked, because those are rendered on the
 * server where CORS does not apply; only the writes failed. That is exactly why it
 * looked intermittent.
 *
 * Routing the browser through this app's own origin removes CORS from the picture
 * entirely, for *any* deployment URL — including Vercel preview builds, whose
 * hostnames are generated per-commit and could never be allow-listed by hand. It
 * also keeps the backend's HttpOnly cookies first-party, so nothing is dropped by
 * a third-party-cookie policy.
 */

export const config = {
  api: {
    // The body must reach the API byte-for-byte. Next's default JSON body parser
    // would consume the stream and re-serialise it, which corrupts any
    // content-type it does not understand.
    bodyParser: false,
  },
};

/** Hop-by-hop headers, and headers the upstream must compute for itself. */
const STRIP_REQUEST = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'transfer-encoding',
]);

const STRIP_RESPONSE = new Set([
  // fetch has already decompressed the body; forwarding the encoding header would
  // make the browser try to inflate plain bytes.
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * A cookie the API sets is scoped to the API's host. Rebind it to this origin, or
 * the browser silently drops it — and the visitor's identity (the `visitor_id`
 * cookie that "أسئلتي" depends on) never survives the round trip.
 */
function rewriteSetCookie(value, isSecure) {
  const parts = value.split(';');
  const out = [parts[0]];

  for (const raw of parts.slice(1)) {
    const attr = raw.trim();
    const name = attr.split('=')[0].toLowerCase();

    if (name === 'domain') continue;

    // `Secure` is rejected outright over plain http, which is what local dev is.
    if (name === 'secure' && !isSecure) continue;

    // SameSite=None requires Secure; over http that pair is invalid and the whole
    // cookie is discarded. First-party through this proxy, so Lax is correct.
    if (name === 'samesite' && !isSecure) {
      out.push('SameSite=Lax');
      continue;
    }

    out.push(attr);
  }

  return out.join('; ');
}

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];

  // Everything after `/api/bff` is the API's own path. The query string is
  // rebuilt from the original URL so that `?search=…` survives verbatim.
  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${API_BASE_URL}/${segments.join('/')}${search}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!STRIP_REQUEST.has(key.toLowerCase()) && typeof value === 'string') {
      headers[key] = value;
    }
  }

  /**
   * Carry the caller's real IP through.
   *
   * The backend rate-limits question and comment submissions per source address.
   * Behind this proxy every request reaches it from the *hosting platform's* egress
   * IP, so without this every visitor would share a single rate-limit bucket and
   * one busy afternoon would lock everyone else out. `x-forwarded-for` is set by
   * the platform to the real client and is forwarded above; this only makes sure a
   * value exists when it is not (local development), and never overwrites one.
   */
  if (!headers['x-forwarded-for']) {
    const ip = req.socket?.remoteAddress;
    if (ip) headers['x-forwarded-for'] = ip;
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  let upstream;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await readBody(req) : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (error) {
    // The API being unreachable is a 502 from this proxy — not a silent hang, and
    // not a 500 that looks like the website itself is broken.
    res.status(502).json({
      message: 'تعذّر الوصول إلى الخادم.',
      detail: error instanceof Error ? error.message : undefined,
    });
    return;
  }

  const isSecure =
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.socket && req.socket.encrypted) ||
    false;

  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE.has(key.toLowerCase())) res.setHeader(key, value);
  });

  const cookies = upstream.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    res.setHeader(
      'set-cookie',
      cookies.map((cookie) => rewriteSetCookie(cookie, isSecure)),
    );
  }

  res.status(upstream.status);

  if (upstream.status === 204 || upstream.status === 304) {
    res.end();
    return;
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.end(buffer);
}
