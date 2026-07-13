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
 * app is the zone host in front of it — Next's Multi-Zones pattern.
 *
 * Without this, `/admin` on this origin is simply not a route here, so it falls
 * through to the public 404. The admin app owns every `/admin/*` route; this
 * config forwards them to it, so one origin serves both apps.
 *
 * In production point ADMIN_ZONE_URL at the admin deployment. Locally it is the
 * admin app's dev server — which must be running, or `/admin` will 502.
 */
/**
 * 127.0.0.1, not `localhost`.
 *
 * On Windows `localhost` resolves to the IPv6 loopback `::1` first. If the admin
 * app happens to be listening on IPv4 only, every proxied request dies with
 * `ECONNREFUSED ::1:3001` — which surfaces as a bare 500 on /admin/* and gives no
 * hint that the address family is the problem. Naming the IPv4 loopback outright
 * removes the ambiguity.
 */
const ADMIN_ZONE_URL = process.env.ADMIN_ZONE_URL || 'http://127.0.0.1:3001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [patternFor(API_BASE_URL), patternFor(UPLOADS_URL)],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async rewrites() {
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
