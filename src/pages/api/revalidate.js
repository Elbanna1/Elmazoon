import { API_BASE_URL } from '@/lib/config';
import { endpoints } from '@/lib/api';

/**
 * On-demand revalidation.
 *
 * The public pages are statically generated and revalidated on a timer:
 * `/articles` and `/articles/[id]` every 300s, `/questions` every 60s. That is
 * what made the site look "not live" — the Ma'zoun published a fatwa or answered
 * a question, refreshed the public site, and saw the old page for up to five
 * minutes. Nothing was broken; the cached HTML simply had not expired yet.
 *
 * This lets the admin push the change through immediately.
 *
 * Authorisation is the admin's own session, not a shared secret: the secret would
 * have to be readable by the admin's browser to be sent, which means shipping it
 * in a client bundle, which means it is not a secret. Instead the caller's cookies
 * are forwarded to the API's own `check-authentication`, and the API decides. An
 * anonymous caller can therefore do nothing here but get a 401.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Ask the backend who this is. Its answer is the authority; we never decide.
  let isAdmin = false;
  try {
    const check = await fetch(`${API_BASE_URL}${endpoints.checkAuth}`, {
      headers: req.headers.cookie ? { cookie: req.headers.cookie } : {},
      cache: 'no-store',
    });
    if (check.ok) {
      const data = await check.json();
      isAdmin = Boolean(data?.isAuthenticated && data?.isAdmin);
    }
  } catch {
    return res.status(502).json({ message: 'Could not reach the API to verify the session.' });
  }

  if (!isAdmin) return res.status(401).json({ message: 'Not authorised.' });

  // Only paths this site actually owns. Accepting an arbitrary `path` would let an
  // admin session be used to hammer any route on the site.
  const articleId = req.body?.articleId;

  const paths = ['/', '/articles', '/questions'];
  if (typeof articleId === 'string' && /^[a-f0-9]{24}$/i.test(articleId)) {
    paths.push(`/articles/${articleId}`);
  }

  const revalidated = [];
  const failed = [];

  for (const path of paths) {
    try {
      await res.revalidate(path);
      revalidated.push(path);
    } catch {
      // A path that has never been generated cannot be revalidated, and that is
      // not an error worth failing the whole call over.
      failed.push(path);
    }
  }

  return res.status(200).json({ revalidated, failed });
}
