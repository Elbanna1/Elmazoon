import Seo, {
  breadcrumbSchema,
  contentSchema,
  entityGraph,
  faqSchema,
  graph,
} from '@/components/Seo';
import ContentPage from '@/components/content/ContentPage';
import {
  pageBySlug,
  pagePath,
  pagesOfKind,
  readingMinutes,
  relatedPages,
  wordCount,
} from '@/content';

/**
 * A guide.
 *
 * Fully static: the content is in the repository, so every one of these is
 * generated at build time and served from the edge with no origin hit at all.
 * `fallback: false` because the set of guides is closed and known — an unknown
 * slug is a 404, not a page to render optimistically.
 */
export async function getStaticPaths() {
  return {
    paths: pagesOfKind('guide').map((page) => ({ params: { slug: page.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const page = pageBySlug(params.slug);
  if (!page) return { notFound: true };

  return {
    props: {
      page,
      // Only what the related cards render. Shipping the full body of four more
      // pages into this one's payload would be a measurable INP cost for nothing.
      related: relatedPages(page).map((item) => ({
        slug: item.slug,
        kind: item.kind,
        silo: item.silo,
        title: item.title,
        description: item.description,
      })),
    },
  };
}

export default function GuidePage({ page, related }) {
  const path = pagePath(page);
  const words = wordCount(page);
  const minutes = readingMinutes(page);

  return (
    <>
      <Seo
        title={page.seoTitle}
        description={page.description}
        type="article"
        publishedAt={page.updated}
        modifiedAt={page.updated}
        jsonLd={graph(
          // The Person/Business/WebSite nodes, so this page's `author` and
          // `publisher` references resolve inside its own graph.
          entityGraph(),
          contentSchema(page, { path, wordCount: words, readingMinutes: minutes }),
          faqSchema(page.faqs),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الأدلة', path: '/guides' },
            { name: page.title, path },
          ]),
        )}
      />

      <ContentPage page={page} related={related} />
    </>
  );
}
