import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Seo, { breadcrumbSchema, graph } from '@/components/Seo';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import ArticleCard from '@/components/ArticleCard';
import Reveal from '@/components/Reveal';
import { ArticleSkeleton } from '@/components/ui/Skeleton';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { api, articleImage, endpoints, toMessage } from '@/lib/api';

const PAGE_SIZE = 30;

/**
 * Server-rendered + revalidated, so the fatwa titles and excerpts are in the
 * HTML. This is the page that most needs to be indexable, and it was previously
 * a client-side fetch into an empty shell.
 */
export async function getStaticProps() {
  try {
    const { data } = await api.get(endpoints.articles, {
      params: { page: 1, limit: PAGE_SIZE },
    });
    return {
      props: {
        initialArticles: data?.articles ?? [],
        totalPages: data?.totalPages ?? 1,
        initialError: false,
      },
      revalidate: 300,
    };
  } catch {
    return {
      props: { initialArticles: [], totalPages: 1, initialError: true },
      revalidate: 30,
    };
  }
}

export default function ArticlesPage({ initialArticles, totalPages, initialError }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(page < totalPages);

  /**
   * Search.
   *
   * The term lives in `?q=` rather than in component state alone, because the
   * WebSite schema declares a SearchAction pointing at `/articles?q={term}` — so
   * that URL has to actually work when Google, or anyone else, navigates to it
   * directly. A schema that promises an entry point the site does not honour is
   * worse than no schema.
   */
  const query = typeof router.query.q === 'string' ? router.query.q : '';

  const runSearch = useCallback(
    async (term) => {
      const trimmed = term.trim();

      // Keep the URL honest, without adding a history entry per keystroke.
      router.replace(
        { pathname: '/articles', query: trimmed ? { q: trimmed } : {} },
        undefined,
        { shallow: true, scroll: false },
      );

      setStatus('loading');
      setError('');

      try {
        const { data } = await api.get(endpoints.articles, {
          params: { page: 1, limit: PAGE_SIZE, ...(trimmed ? { search: trimmed } : {}) },
        });
        setArticles(data?.articles ?? []);
        setHasMore(1 < (data?.totalPages ?? 1));
        setPage(1);
        setStatus('idle');
      } catch (err) {
        setError(toMessage(err, 'تعذّر تحميل الفتاوى.'));
        setStatus('error');
      }
    },
    [router],
  );

  const loadMore = useCallback(async () => {
    const next = page + 1;
    setStatus('loading');
    setError('');

    try {
      const { data } = await api.get(endpoints.articles, {
        // "Load more" must stay inside the current search, or page 2 silently
        // reverts to the unfiltered list.
        params: { page: next, limit: PAGE_SIZE, ...(query.trim() ? { search: query.trim() } : {}) },
      });
      const batch = data?.articles ?? [];

      // Append. The old handler replaced the list, so "Load More" deleted the
      // articles you were already looking at.
      setArticles((prev) => [...prev, ...batch]);
      setHasMore(next < (data?.totalPages ?? next));
      setPage(next);
      setStatus('idle');
    } catch (err) {
      setError(toMessage(err, 'تعذّر تحميل الفتاوى.'));
      setStatus('error');
    }
  }, [page, query]);

  const retry = useCallback(() => runSearch(query), [runSearch, query]);

  /**
   * Landing directly on `/articles?q=زواج` — from Google's sitelinks search box,
   * or from a shared link — must show search results, not the unfiltered list
   * that `getStaticProps` baked in. The page is statically generated, so the
   * server cannot know the query; the client resolves it on mount.
   */
  const didHydrateSearch = useRef(false);
  useEffect(() => {
    if (!router.isReady || didHydrateSearch.current) return;
    didHydrateSearch.current = true;
    if (query.trim()) runSearch(query);
    // `runSearch` is stable enough here: this fires exactly once, guarded by the ref.
  }, [router.isReady, query, runSearch]);

  const failedEmpty = (initialError || status === 'error') && articles.length === 0;
  const isSearching = Boolean(query.trim());

  return (
    <>
      <Seo
        title="الفتاوى"
        description="فتاوى ومقالات المأذون الشرعي حول شروط الزواج وكتب الكتاب وتوثيق العقد والطلاق والرجعة وزواج الأجانب."
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
              lede="مقالات وإجابات شرعية وقانونية حول شروط الزواج وكتب الكتاب وتوثيق العقد والطلاق."
            />
          </Reveal>
        </Container>
      </Section>

      <Section spacing="tight" className="pt-0">
        <Container>
          <Reveal>
            <ArticleSearch initial={query} onSearch={runSearch} busy={status === 'loading'} />
          </Reveal>
          {isSearching && status === 'idle' && (
            <p aria-live="polite" className="mt-4 text-center text-sm text-ink-400">
              {articles.length > 0
                ? `${articles.length} نتيجة للبحث عن «${query}»`
                : `لا توجد نتائج للبحث عن «${query}»`}
            </p>
          )}
        </Container>
      </Section>

      <Section spacing="tight" className="pb-20 pt-0 sm:pb-24">
        <Container>
          {failedEmpty ? (
            <div className="mx-auto max-w-md space-y-4">
              <Alert tone="error">{error || 'تعذّر الوصول إلى الخادم.'}</Alert>
              <div className="text-center">
                <Button variant="secondary" loading={status === 'loading'} onClick={retry}>
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : articles.length === 0 && status === 'loading' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            // A search that found nothing is a different state from an empty
            // archive, and it needs a different way out.
            <EmptyState
              title={isSearching ? 'لا توجد نتائج مطابقة' : 'لا توجد فتاوى منشورة بعد'}
              description={
                isSearching
                  ? `لم نعثر على فتوى تطابق «${query}». جرّب كلمة أخرى، أو اطرح سؤالك على المأذون.`
                  : 'تابعنا قريبًا — سيتم نشر الفتاوى والمقالات هنا.'
              }
              action={
                isSearching ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="secondary" onClick={() => runSearch('')}>
                      عرض كل الفتاوى
                    </Button>
                    <Button href="/questions" variant="ink">
                      اطرح سؤالك
                    </Button>
                  </div>
                ) : (
                  <Button href="/questions" variant="secondary">
                    اطرح سؤالك
                  </Button>
                )
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
                  <p className="text-sm text-ink-400">عرضنا كل الفتاوى المنشورة.</p>
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
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Search over the fatwas.
 *
 * A real <form> with a submit button, not a debounced key-handler: the query goes
 * into the URL, so submitting is a navigation and should be a deliberate act. It
 * also means the search works with the keyboard alone, and that Enter does what
 * every user expects it to.
 */
function ArticleSearch({ initial, onSearch, busy }) {
  const id = useId();
  const [draft, setDraft] = useState(initial);

  // Re-sync when the URL changes from outside (back button, a shared link).
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setDraft(initial);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft);
      }}
      className="mx-auto flex max-w-xl gap-2"
    >
      <div className="relative flex-1">
        <label htmlFor={id} className="sr-only">
          ابحث في الفتاوى
        </label>
        <span
          className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ink-300"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>

        <input
          id={id}
          type="search"
          name="q"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="ابحث في الفتاوى…"
          className="h-12 w-full rounded-xl border border-ink-100 bg-surface ps-10 pe-10 text-[0.9375rem] text-ink-900 shadow-subtle transition-[border-color,box-shadow] duration-200 ease-premium placeholder:text-ink-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />

        {draft && (
          <button
            type="button"
            onClick={() => {
              setDraft('');
              onSearch('');
            }}
            aria-label="مسح البحث"
            className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-ink-300 transition-colors hover:text-ink-700"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <Button type="submit" size="lg" loading={busy}>
        بحث
      </Button>
    </form>
  );
}
