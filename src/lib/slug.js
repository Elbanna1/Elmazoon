/**
 * URLs for API-backed articles.
 *
 * The backend has no `slug` column and cannot be changed, so an article's only
 * stable key is its Mongo `_id` — a 24-character hex string that says nothing to
 * a reader and nothing to a crawler. `/articles/6a5511be67225f5a836e5ac7` is the
 * worst possible URL for an Arabic authority site: the URL is one of the few
 * places Google still reads keywords verbatim, and it is the part a human decides
 * whether to trust before they click.
 *
 * So the slug is derived on the frontend from the title, and the id is kept as a
 * suffix:
 *
 *     /articles/شروط-صحة-عقد-الزواج-6a5511be67225f5a836e5ac7
 *
 * The suffix is what makes this safe without a backend migration:
 *
 *  - **Lookup stays exact.** The id is parsed back out of the URL, so the page
 *    still fetches by id. No slug->id table, no second request, nothing to keep
 *    in sync, and no way for the two to drift apart.
 *  - **Uniqueness is free.** Two articles may legitimately share a title; their
 *    ids cannot collide, so the URLs cannot either.
 *  - **Retitling cannot 404.** The slug half is decorative. If the title changes,
 *    the old URL still resolves — the page just redirects to the new canonical
 *    form, exactly like Stack Overflow and Medium do it.
 *
 * Arabic is kept in the slug rather than transliterated. Google percent-decodes
 * and renders it as Arabic in the result, and an Arabic query matching an Arabic
 * URL is a relevance signal that `shoroot-sihhat-aqd-alzawaj` throws away.
 */

/** Mongo ObjectId: exactly 24 hex characters. */
const OBJECT_ID = /[0-9a-f]{24}/i;

/** Arabic diacritics (harakat) and the tatweel elongation character. */
const DIACRITICS = /[ً-ْٰـ]/g;

/**
 * Turn a title into a URL slug.
 *
 * Keeps Arabic letters, Latin letters and digits. Everything else — punctuation,
 * the Arabic comma, quotation marks, question marks — collapses to a single
 * hyphen, because a `?` or `«` inside a path has to be percent-encoded and turns
 * a readable Arabic URL back into line noise.
 *
 * Diacritics are stripped rather than encoded: they are invisible in a URL bar,
 * they double the encoded length of every character that carries one, and two
 * titles differing only in harakat should not produce two different URLs.
 */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(DIACRITICS, '')
    // Keep: Arabic block, Arabic supplement/extended, Latin, digits.
    .replace(/[^ء-غف-يٱ-ۓa-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    // A trailing hyphen can reappear after the length clamp.
    .replace(/-+$/g, '');
}

/**
 * The canonical path for an article.
 *
 * Falls back to the bare id when the title slugifies to nothing — a title that is
 * pure punctuation, or the placeholder rows currently in the database. A URL of
 * `/articles/-6a55…` would be worse than no slug at all.
 */
export function articlePath(article) {
  if (!article?._id) return '/articles';

  const slug = slugify(article.title);
  return slug ? `/articles/${slug}-${article._id}` : `/articles/${article._id}`;
}

/**
 * The absolute URL, percent-encoded — for sitemaps and feeds, where an XML
 * document requires escaped URLs and a raw Arabic path is a spec violation.
 *
 * The on-page canonical goes through `canonicalUrl` in `Seo.jsx` instead, which
 * encodes identically; the two must agree exactly.
 */
export function articleUrl(article, origin) {
  return `${origin}${encodeURI(articlePath(article))}`;
}

/**
 * Pull the id back out of a URL segment.
 *
 * Accepts both forms — the slugged URL and a bare id — because every link that
 * existed before this change is the bare form, and those must keep resolving.
 * The id is matched at the *end*, anchored, so an id-like run of hex inside the
 * slug body cannot be mistaken for it.
 */
export function idFromSlug(segment) {
  const value = decodeURIComponent(String(segment ?? ''));

  const tail = value.match(new RegExp(`(?:^|-)(${OBJECT_ID.source})$`, 'i'));
  if (tail) return tail[1];

  // A bare id, from a link predating the slugs.
  return new RegExp(`^${OBJECT_ID.source}$`, 'i').test(value) ? value : null;
}

/**
 * Whether the URL the visitor arrived on is already the canonical one.
 *
 * Used to decide between rendering the page and redirecting to the correct slug.
 * Compares decoded, because the incoming segment arrives percent-encoded from the
 * router and the derived slug does not.
 */
export function isCanonicalSegment(segment, article) {
  const current = decodeURIComponent(String(segment ?? ''));
  const canonical = articlePath(article).replace('/articles/', '');
  return current === canonical;
}
