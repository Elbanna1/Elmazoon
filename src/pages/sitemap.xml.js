import { api, articleImage, endpoints } from '@/lib/api';
import { site } from '@/lib/site';
import { articlePath } from '@/lib/slug';
import { pages, pagePath } from '@/content';

/**
 * Generated at request time so a newly published fatwa appears without a rebuild.
 * If the API is unreachable the sitemap still emits the static pages rather than
 * 500-ing — a sitemap that returns an error teaches Google to stop fetching it.
 *
 * Includes the image sitemap extension: an article's cover image is declared
 * alongside its URL, which is what makes it eligible for image search.
 */
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/services', priority: '0.9', changefreq: 'monthly' },
  { path: '/guides', priority: '0.9', changefreq: 'weekly' },
  { path: '/questions', priority: '0.8', changefreq: 'daily' },
  { path: '/articles', priority: '0.8', changefreq: 'weekly' },
];

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * A URL fit for an XML document.
 *
 * Two separate requirements, and missing either one invalidates the entry:
 *
 *  - **Percent-encoding.** Arabic slugs must be encoded, because the sitemap spec
 *    requires URLs to be RFC-3986 escaped. A raw Arabic path in a sitemap is a
 *    parse error for some consumers and silently dropped by others.
 *  - **XML-escaping, afterwards.** `encodeURI` leaves `&` alone, and a bare `&`
 *    in an XML document is malformed — one of them invalidates the entire file,
 *    not just the offending `<url>`.
 */
function loc(path) {
  return escapeXml(`${site.url}${path === '/' ? '' : encodeURI(path)}`);
}

/** W3C datetime. An invalid `lastmod` makes Google discard the whole entry. */
function iso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toXml(urls) {
  const body = urls
    .map(({ path, lastmod, changefreq, priority, image, title }) => {
      const parts = [`    <loc>${loc(path)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      parts.push(`    <changefreq>${changefreq}</changefreq>`);
      parts.push(`    <priority>${priority}</priority>`);
      if (image) {
        parts.push(
          `    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n      <image:title>${escapeXml(title)}</image:title>\n    </image:image>`,
        );
      }
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const urls = STATIC_PAGES.map((page) => ({
    path: page.path,
    changefreq: page.changefreq,
    priority: page.priority,
  }));

  /**
   * The guides and services.
   *
   * These are the pages the site is actually trying to rank, and they are the
   * only ones whose `lastmod` is trustworthy — it is the editorial `updated` date
   * in the content file, not a database timestamp that moves every time somebody
   * views the row. Services outrank guides in priority because they are the pages
   * a search is trying to reach when the searcher is ready to act.
   */
  for (const page of pages) {
    urls.push({
      path: pagePath(page),
      lastmod: iso(page.updated),
      changefreq: 'monthly',
      priority: page.kind === 'service' ? '0.9' : '0.8',
    });
  }

  try {
    const { data } = await api.get(endpoints.articles, { params: { page: 1, limit: 200 } });

    for (const article of data?.articles ?? []) {
      urls.push({
        // The slugged path — the same URL the canonical tag declares. A sitemap
        // listing `/articles/{id}` would be feeding Google a list of redirects.
        path: articlePath(article),
        lastmod: iso(article.updatedAt || article.createdAt),
        changefreq: 'monthly',
        priority: '0.7',
        image: articleImage(article) || undefined,
        title: article.title,
      });
    }
  } catch {
    // Backend unreachable — emit the static and content pages only.
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(toXml(urls));
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
