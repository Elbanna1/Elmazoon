import type { NextConfig } from "next";

/**
 * The API returns each article's `imageUrl` as an absolute URL, and it does not
 * point at the API host — it points at the uploads host. `next/image` refuses any
 * host it has not been told about, and it refuses it *during render*, so a single
 * unlisted thumbnail takes down the whole articles page rather than just itself.
 *
 * Both hosts are derived from env so that repointing the backend does not require
 * touching this file — the same promise `NEXT_PUBLIC_API_URL` makes everywhere else.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://elmazoon.runasp.net";
const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL ?? "https://api.almaazoon.com";

function patternFor(url: string) {
  const { protocol, hostname, port } = new URL(url);
  return {
    protocol: protocol.replace(":", "") as "http" | "https",
    hostname,
    ...(port ? { port } : {}),
    pathname: "/**",
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Multi-Zones asset prefix.
   *
   * This app is served to the browser through the public site's origin, which
   * rewrites `/admin/*` here. Both apps are Next apps, so both want to serve their
   * bundles from `/_next/*` — and the browser, seeing a single origin, cannot tell
   * them apart. The public site would answer the admin's chunk requests with its
   * own chunks, and the admin would hydrate into nothing.
   *
   * Prefixing moves this app's assets to `/admin-static/_next/*`, which the public
   * site rewrites straight back here. Nothing else changes: routes stay at
   * `/admin/*`, because that is already where they live.
   */
  assetPrefix: "/admin-static",

  images: {
    remotePatterns: [patternFor(API_URL), patternFor(UPLOADS_URL)],
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      // The dashboard used to live at /dashboard. Old bookmarks must keep working.
      // Not `permanent`: a 308 is cached by the browser indefinitely and is
      // painful to walk back if this ever moves again.
      { source: "/dashboard", destination: "/admin/dashboard", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // An admin surface must never be indexed, whatever a crawler is told
          // by the page metadata.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
