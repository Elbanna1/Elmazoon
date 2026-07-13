/** @type {import('next').NextConfig} */

/**
 * There is one backend, and it is named in one place: `src/lib/config.js`.
 *
 * What used to be here — a `DEV_API` of `http://localhost:5000`, a `PROD_API` of
 * `http://159.203.131.104:5000`, and an `env.server` value chosen by build phase —
 * is gone. That arrangement meant the origin was decided at build time and baked
 * into the bundle, so a dev build could only ever talk to localhost and a prod
 * build could only ever talk to a bare IP over plain HTTP.
 *
 * This file now only mirrors the same env var for `next/image`, which needs the
 * image hosts declared up front and cannot read the config module.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://elmazoon.runasp.net';

// Uploads are served from their own origin, not from the API host — the API
// returns each article's `imageUrl` already pointing here.
const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || 'https://api.almaazoon.com';

/**
 * next/image refuses any host not declared here, and it refuses it *during
 * render* — so one unlisted image takes down the whole page, not just itself.
 */
function patternFor(url) {
  const { protocol, hostname, port } = new URL(url);
  return {
    protocol: protocol.replace(':', ''),
    hostname,
    ...(port ? { port } : {}),
    pathname: '/**',
  };
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/**
 * The admin dashboard is a second, separate Next application (`admin/`), and this
 * app is the zone host in front of it — Next's Multi-Zones pattern. The admin owns
 * every `/admin/*` route; this config forwards them, so one origin serves both.
 *
 * Locally the zone is the admin's dev server on 127.0.0.1:3001 (not `localhost` —
 * on Windows that resolves to the IPv6 loopback `::1` first, and if the admin is
 * listening on IPv4 only, every proxied request dies with `ECONNREFUSED ::1:3001`).
 *
 * In production ADMIN_ZONE_URL **must** be set to the admin's own deployment URL.
 * The loopback default must never survive into a deployed build: Vercel resolves
 * the rewrite destination itself, sees a private address, and refuses it with
 * `X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE` — a 404 whose cause is invisible
 * from the outside. That is exactly the failure this guard exists to prevent.
 */
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production';

const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:\d+)?$/i;
const PRIVATE_NET = /^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

const RAW_ADMIN_ZONE_URL = process.env.ADMIN_ZONE_URL || '';

/**
 * Resolve the zone, or resolve to nothing.
 *
 * If this returns null the /admin rewrites are omitted entirely, and `/admin`
 * falls through to the public 404. A clean "not found" is a far better failure
 * than a rewrite pointing somewhere unreachable — the public site keeps working
 * either way, and the build says out loud what is wrong.
 */
function resolveAdminZone() {
  const isPrivate = (url) => LOOPBACK.test(url) || PRIVATE_NET.test(url);

  if (!IS_PRODUCTION_BUILD) {
    return RAW_ADMIN_ZONE_URL || 'http://127.0.0.1:3001';
  }

  if (!RAW_ADMIN_ZONE_URL) {
    console.warn(
      '\n[zones] ADMIN_ZONE_URL is not set. The /admin routes will NOT be proxied,\n' +
        '        and /admin will 404. Set it to the admin app\'s deployment URL\n' +
        '        (e.g. https://elmazoon-admin.vercel.app) and redeploy.\n',
    );
    return null;
  }

  if (isPrivate(RAW_ADMIN_ZONE_URL)) {
    console.warn(
      `\n[zones] ADMIN_ZONE_URL is a private address (${RAW_ADMIN_ZONE_URL}).\n` +
        '        A hosting platform cannot reach it, so the /admin rewrites are\n' +
        '        being omitted rather than shipped broken. Point it at a public URL.\n',
    );
    return null;
  }

  return RAW_ADMIN_ZONE_URL;
}

const ADMIN_ZONE_URL = resolveAdminZone();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [patternFor(API_BASE_URL), patternFor(UPLOADS_URL)],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async rewrites() {
    // No reachable zone: ship no /admin rewrites at all. `/admin` then 404s
    // cleanly instead of pointing at an address the platform will reject.
    if (!ADMIN_ZONE_URL) return [];

    return [
      // The admin's pages.
      { source: '/admin', destination: `${ADMIN_ZONE_URL}/admin` },
      { source: '/admin/:path*', destination: `${ADMIN_ZONE_URL}/admin/:path*` },

      // The admin's JS/CSS. It sets `assetPrefix: '/admin-static'` precisely so
      // that its bundles do not collide with this app's `/_next/*` — the browser
      // sees one origin and could not otherwise tell the two apps' chunks apart.
      { source: '/admin-static/:path*', destination: `${ADMIN_ZONE_URL}/admin-static/:path*` },

      // The admin's backend-for-frontend proxy. Its pages call `/bff/*` on
      // whatever origin they are served from — which, through this zone, is this
      // one. Forward it, or every admin API call 404s here.
      { source: '/bff/:path*', destination: `${ADMIN_ZONE_URL}/bff/:path*` },
    ];
  },

  async redirects() {
    return [
      // The dashboard used to live at /dashboard on this app. Old links must not
      // break. Not `permanent`: a 308 is cached by browsers indefinitely.
      { source: '/dashboard', destination: '/admin/dashboard', permanent: false },
      { source: '/dashboard/:path*', destination: '/admin/dashboard', permanent: false },
    ];
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
