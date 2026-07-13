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

export async function getStaticPaths() {
  return {
    paths: pagesOfKind('service').map((page) => ({ params: { slug: page.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const page = pageBySlug(params.slug);
  if (!page || page.kind !== 'service') return { notFound: true };

  return {
    props: {
      page,
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

export default function ServicePage({ page, related }) {
  const path = pagePath(page);

  return (
    <>
      <Seo
        title={page.seoTitle}
        description={page.description}
        // `website`, not `article`: this is a service the business offers, and
        // og:type=article on it would put an author byline on a service listing.
        jsonLd={graph(
          // The Service node's `provider` points at the business by @id; without
          // these nodes in the graph that reference resolves to nothing.
          entityGraph(),
          contentSchema(page, {
            path,
            wordCount: wordCount(page),
            readingMinutes: readingMinutes(page),
          }),
          faqSchema(page.faqs),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الخدمات', path: '/services' },
            { name: page.title, path },
          ]),
        )}
      />

      <ContentPage page={page} related={related} />
    </>
  );
}
