/**
 * Push a change through to the public site immediately.
 *
 * The public pages are statically generated with a revalidation timer (300s for
 * articles, 60s for questions). Without this, a fatwa published here would not
 * appear on almaazoon.com for up to five minutes — the site was not broken, its
 * cached HTML simply had not expired.
 *
 * `/api/revalidate` belongs to the *public* app, not this one. Through the
 * Multi-Zones setup both are served from the same origin, so a same-origin POST
 * from the admin lands on the public app's route handler. It authorises the call
 * by forwarding the admin's own cookies to the API — no shared secret, so nothing
 * needs to be embedded in this bundle.
 *
 * Deliberately fire-and-forget: revalidation is a cache hint, and a failed hint
 * must never turn a successful publish into an error toast. The worst case is the
 * old behaviour — the page refreshes on its own timer.
 */
export function revalidatePublicSite(articleId?: string): void {
  if (typeof window === "undefined") return;

  void fetch("/api/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The admin's session cookies are what authorise this.
    credentials: "include",
    body: JSON.stringify(articleId ? { articleId } : {}),
    keepalive: true,
  }).catch(() => {
    /* The publish already succeeded. The public page will catch up on its timer. */
  });
}
