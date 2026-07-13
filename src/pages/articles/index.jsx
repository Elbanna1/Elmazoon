import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Seo, { breadcrumbSchema, graph } from '@/components/Seo';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import ArticleCard from '@/components/ArticleCard';
import SiteSearch from '@/components/SiteSearch';
import Reveal from '@/components/Reveal';
import { ArticleSkeleton } from '@/components/ui/Skeleton';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { api, articleImage, endpoints, toMessage } from '@/lib/api';
import { articlePath } from '@/lib/slug';

const PAGE_SIZE = 30;

/** How many fatwas are pulled into the client-side search index. */
const SEARCH_LIMIT = 200;

/**
 * Server-rendered + revalidated, so the fatwa titles and excerpts are in the HTML.
 * This is the page that most needs to be indexable, and it was previously a
 * client-side fetch into an empty shell.
 */
export async function getStaticProps() {
  try {
    const { data } = await api.get(endpoints.articles, {
      params: { page: 1, limit: SEARCH_LIMIT },
    });

    const all = data?.articles ?? [];

    /**
     * The search index ships with the page.
     *
     * Titles and short excerpts only — a few KB — not the full bodies. That is
     * enough to search well, and it means a query is answered without a network
     * round trip. Shipping the complete text of 200 fatwas to make search work
     * would trade a fast search for a slow page, which is the wrong trade.
     */
    const searchIndex = all.map((article) => ({
      _id: article._id,
      title: article.title,
      href: articlePath(article),
      excerpt: (article.content || '').trim().slice(0, 200),
    }));

    return {
      props: {
        initialArticles: all.slice(0, PAGE_SIZE),
        searchIndex,
        totalPages: data?.totalPages ?? 1,
        initialError: false,
      },
      revalidate: 300,
    };
  } catch {
    return {
      props: { initialArticles: [], searchIndex: [], totalPages: 1, initialError: true },
      revalidate: 30,
    };
  }
}

export default function ArticlesPage({ initialArticles, searchIndex, totalPages, initialError }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(1 < totalPages);

  /**
   * The term lives in `?q=` rather than in component state alone, because the
   * WebSite schema declares a SearchAction pointing at `/articles?q={term}` — so
   * that URL has to actually work when Google, or anyone else, navigates to it
   * directly. A schema that promises an entry point the site does not honour is
   * worse than no schema.
   */
  const query = typeof router.query.q === 'string' ? router.query.q : '';
  const [term, setTerm] = useState(query);

  // Landing directly on `/articles?q=زواج` must show results, not the unfiltered
  // list the static build baked in. The page is static, so the server cannot know
  // the query; the client resolves it once, on mount.
  const didHydrate = useRef(false);
  useEffect(() => {
    if (!router.isReady || didHydrate.current) return;
    didHydrate.current = true;
    if (query) setTerm(query);
  }, [router.isReady, query]);

  /** Keep the URL honest, without adding a history entry per keystroke. */
  const onQueryChange = useCallback(
    (next) => {
      setTerm(next);
      router.replace({ pathname: '/articles', query: next ? { q: next } : {} }, undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [router],
  );

  /**
   * "Load more" only browses now — it never has to carry a search term, because
   * search no longer round-trips to the server at all. The old handler passed the
   * query through to the API and *replaced* the list with the response, which is
   * why pressing it used to delete the articles you were already looking at.
   */
  const loadMore = useCallback(async () => {
    const next = page + 1;
    setStatus('loading');
    setError('');

    try {
      const { data } = await api.get(endpoints.articles, {
        params: { page: next, limit: PAGE_SIZE },
      });
      const batch = data?.articles ?? [];

      setArticles((prev) => [...prev, ...batch]);
      setHasMore(next < (data?.totalPages ?? next));
      setPage(next);
      setStatus('idle');
    } catch (err) {
      setError(toMessage(err, 'تعذّر تحميل الفتاوى.'));
      setStatus('error');
    }
  }, [page]);

  const isSearching = Boolean(term.trim());
  const failedEmpty = initialError && articles.length === 0;

  return (
    <>
      <Seo
        title="الفتاوى"
        description="فتاوى ومقالات المأذون الشرعي حول شروط الزواج وكتب الكتاب وتوثيق العقد والطلاق والرجعة وزواج الأجانب."
        /**
         * A search-results URL is noindexed, the bare archive is not.
         *
         * `/articles?q=…` must stay *crawlable* — the SearchAction in the WebSite
         * schema points at it, and Google has to be able to fetch it. But the
         * query space is unbounded and every result page is thin and
         * near-duplicate, so none of them should enter the index. `noindex,
         * follow` is exactly that: do not index this page, do follow its links.
         *
         * The canonical tag already resolves to `/articles` (the query string is
         * stripped), so the archive keeps whatever authority the result URLs earn.
         */
        noindex={isSearching}
        jsonLd={graph(
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الفتاوى', path: '/articles' },
          ]),
        )}
      />

      <Section spacing="tight" className="pt-12 sm:pt-16">
        <Container>
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="الفتاوى"
              title="فتاوى ومقالات المأذون الشرعي"
              lede="ابحث في الفتاوى والأدلة معًا — البحث يفهم العربية، ويتجاوز الأخطاء الإملائية."
            />
          </Reveal>
        </Container>
      </Section>

      <Section spacing="tight" className="pt-0">
        <Container>
          <Reveal>
            <SiteSearch articles={searchIndex} initial={query} onQueryChange={onQueryChange} />
          </Reveal>
        </Container>
      </Section>

      {/* The archive. Hidden while searching — the results have replaced it. */}
      {!isSearching && (
        <Section spacing="tight" className="pb-20 pt-0 sm:pb-24">
          <Container>
            {failedEmpty ? (
              <div className="mx-auto max-w-md space-y-4">
                <Alert tone="error">تعذّر الوصول إلى الخادم.</Alert>
                <div className="text-center">
                  <Button variant="secondary" onClick={() => router.reload()}>
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            ) : articles.length === 0 ? (
              <EmptyState
                title="لا توجد فتاوى منشورة بعد"
                description="تابعنا قريبًا — سيتم نشر الفتاوى والمقالات هنا. وفي الأثناء، تصفّح الأدلة الشرعية والقانونية."
                action={
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button href="/guides" variant="secondary">
                      تصفّح الأدلة
                    </Button>
                    <Button href="/questions" variant="ink">
                      اطرح سؤالك
                    </Button>
                  </div>
                }
              />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article, i) => (
                    // h-full so the Reveal wrapper stretches with the grid row and
                    // the cards inside it line up along a common bottom edge.
                    <Reveal key={article._id} delay={Math.min(i, 5) * 60} className="h-full">
                      <ArticleCard
                        id={article._id}
                        title={article.title}
                        content={article.content}
                        image={articleImage(article)}
                        // Only the first row is above the fold.
                        priority={i < 3}
                      />
                    </Reveal>
                  ))}

                  {status === 'loading' &&
                    Array.from({ length: 3 }).map((_, i) => <ArticleSkeleton key={`more-${i}`} />)}
                </div>

                <div className="mt-12 text-center">
                  {hasMore ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      loading={status === 'loading'}
                      onClick={loadMore}
                    >
                      عرض المزيد
                    </Button>
                  ) : (
                    <p className="text-sm text-ink-500">عرضنا كل الفتاوى المنشورة.</p>
                  )}
                  {status === 'error' && (
                    <div className="mx-auto mt-5 max-w-md">
                      <Alert tone="error">{error}</Alert>
                    </div>
                  )}
                </div>
              </>
            )}
          </Container>
        </Section>
      )}
    </>
  );
}
