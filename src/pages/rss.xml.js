import { api, endpoints } from '@/lib/api';
import { site } from '@/lib/site';
import { articlePath } from '@/lib/slug';
import { pages, pagePath } from '@/content';

/**
 * RSS 2.0 feed of everything the site publishes — the fatwas from the API and the
 * guides from the repository, newest first.
 *
 * Generated at request time so a newly published fatwa is in the feed without a
 * rebuild, and cached at the edge for an hour so it costs the backend nothing.
 *
 * The guides belong in here too. A feed that carries only the API's articles
 * would omit the pages the site is actually built to rank, and those are the ones
 * an aggregator or a returning reader most wants to be told about.
 */

/** XML has five reserved characters. A fatwa title containing `&` must not break the feed. */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

/** Arabic slugs must be percent-encoded before they are XML-escaped. */
function absolute(path) {
  return `${site.url}${encodeURI(path)}`;
}

export async function getServerSideProps({ res }) {
  let articles = [];

  try {
    const { data } = await api.get(endpoints.articles, { params: { page: 1, limit: 50 } });
    articles = data?.articles ?? [];
  } catch {
    // An unreachable backend yields an empty feed, not a 500.
  }

  const entries = [
    ...pages.map((page) => ({
      title: page.title,
      url: absolute(pagePath(page)),
      date: page.updated,
      excerpt: page.description,
    })),
    ...articles.map((article) => ({
      title: article.title,
      url: absolute(articlePath(article)),
      date: article.createdAt,
      excerpt: (article.content || '').trim().slice(0, 300),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const items = entries
    .map(
      (entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <guid isPermaLink="true">${escapeXml(entry.url)}</guid>
      <pubDate>${rfc822(entry.date)}</pubDate>
      <dc:creator>${escapeXml(site.fullName)}</dc:creator>
      <description>${escapeXml(entry.excerpt)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${site.name} — ${site.fullName}`)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ar-eg</language>
    <lastBuildDate>${rfc822(entries[0]?.date ?? Date.now())}</lastBuildDate>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Rss() {
  return null;
}
