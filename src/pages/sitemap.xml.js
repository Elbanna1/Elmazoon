import { api, articleImage, endpoints } from '@/lib/api';
import { site } from '@/lib/site';

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
  { path: '/questions', priority: '0.9', changefreq: 'daily' },
  { path: '/articles', priority: '0.9', changefreq: 'weekly' },
];

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** W3C datetime. An invalid `lastmod` makes Google discard the whole entry. */
function iso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toXml(urls) {
  const body = urls
    .map(({ loc, lastmod, changefreq, priority, image, title }) => {
      const parts = [`    <loc>${escapeXml(loc)}</loc>`];
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
    loc: `${site.url}${page.path === '/' ? '' : page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
  }));

  try {
    const { data } = await api.get(endpoints.articles, { params: { page: 1, limit: 200 } });

    for (const article of data?.articles ?? []) {
      urls.push({
        loc: `${site.url}/articles/${article._id}`,
        lastmod: iso(article.updatedAt || article.createdAt),
        changefreq: 'monthly',
        priority: '0.7',
        image: articleImage(article) || undefined,
        title: article.title,
      });
    }
  } catch {
    // Backend unreachable — emit the static pages only.
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
