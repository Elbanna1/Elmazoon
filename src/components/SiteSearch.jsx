import { useCallback, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { indexDocument, relatedSearches, search, suggest } from '@/lib/search';
import { contentIndex, silos } from '@/content';

/**
 * Search over everything the site publishes — the guides, the services and the
 * fatwas — in one box.
 *
 * It runs in the browser, over a normalized index, and that is a deliberate
 * replacement for the backend's `?search=` parameter rather than an addition to
 * it. The backend does a substring match on the raw stored string, which in Arabic
 * fails on input that is correctly spelled: `الاجانب` does not substring-match
 * `الأجانب`, `الطلاق` does not match `الطَّلاق`, and `وللزوجة` does not match
 * `الزوجة`. The visitor types a word that is on the page and is told there are no
 * results. See `lib/search.js` for what the normalizer folds and why.
 *
 * Searching client-side also makes the search *cross-content*: a query for «المهر»
 * returns the guide that explains it and the fatwas that mention it, ranked
 * together. A server search over one table could never do that, and the guide is
 * almost always the better answer.
 *
 * The corpus is a few dozen pages. A linear scan over it is faster than the
 * network round trip it replaces.
 */
export default function SiteSearch({ articles = [], initial = '', onQueryChange }) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState(initial);

  // Re-sync when the URL changes from outside — the back button, a shared link,
  // or Google's sitelinks search box landing on `/articles?q=…`.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setDraft(initial);
    setQuery(initial);
  }

  /**
   * The index: the static content plus whatever fatwas the page was given.
   *
   * Rebuilt only when the article list changes — never per keystroke. Normalizing
   * a few hundred documents on every character typed is the difference between a
   * search that feels instant and one that drops frames on a mid-range phone.
   */
  const index = useMemo(
    () => [
      ...contentIndex,
      ...articles.map((article) =>
        indexDocument({
          id: article._id,
          href: article.href,
          title: article.title,
          body: article.excerpt,
          kind: 'article',
          silo: 'fatwa',
        }),
      ),
    ],
    [articles],
  );

  const results = useMemo(() => (query.trim() ? search(index, query) : []), [index, query]);
  const related = useMemo(
    () => (query.trim() && results.length > 0 ? relatedSearches(index, query) : []),
    [index, query, results.length],
  );
  const didYouMean = useMemo(
    () => (query.trim() && results.length === 0 ? suggest(index, query) : null),
    [index, query, results.length],
  );

  const run = useCallback(
    (term) => {
      setDraft(term);
      setQuery(term);
      onQueryChange?.(term);
    },
    [onQueryChange],
  );

  const isSearching = Boolean(query.trim());

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          run(draft);
        }}
        className="mx-auto flex max-w-xl gap-2"
      >
        <div className="relative flex-1">
          <label htmlFor={id} className="sr-only">
            ابحث في الأدلة والفتاوى
          </label>
          <span
            className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-ink-300"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="m20 20-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            id={id}
            type="search"
            name="q"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="ابحث… مثل: المهر، الرجعة، قائمة المنقولات"
            className="h-12 w-full rounded-xl border border-ink-100 bg-surface ps-10 pe-10 text-[0.9375rem] text-ink-900 shadow-subtle transition-[border-color,box-shadow] duration-200 ease-premium placeholder:text-ink-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />

          {draft && (
            <button
              type="button"
              onClick={() => run('')}
              aria-label="مسح البحث"
              className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-ink-300 transition-colors hover:text-ink-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        <Button type="submit" size="lg">
          بحث
        </Button>
      </form>

      {isSearching && (
        // `aria-live` so a screen reader is told the result count changed. The
        // results appear without a navigation, so nothing else would announce it.
        <div aria-live="polite" className="mt-8">
          {results.length > 0 ? (
            <>
              <p className="text-center text-sm text-ink-500">
                <span className="ltr-nums">{results.length}</span> نتيجة للبحث عن «{query}»
              </p>

              <ul className="mx-auto mt-6 max-w-2xl space-y-3">
                {results.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={hit.href}
                      className="group flex flex-col rounded-xl border border-ink-100 bg-surface p-4 shadow-subtle transition-shadow duration-300 ease-premium hover:shadow-card"
                    >
                      <span className="text-xs font-medium text-gold-600">
                        {labelFor(hit)}
                      </span>
                      <span className="ugc mt-1 text-[0.9375rem] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-gold-700">
                        {hit.label}
                      </span>
                      {hit.excerpt && (
                        <span className="ugc mt-1.5 line-clamp-2 text-sm leading-[1.85] text-ink-500">
                          {hit.excerpt}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {related.length > 0 && (
                <nav aria-labelledby="related-searches" className="mx-auto mt-8 max-w-2xl">
                  <h2 id="related-searches" className="text-sm font-medium text-ink-500">
                    عمليات بحث ذات صلة
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {related.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => run(term)}
                          className="inline-flex items-center rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-[0.8125rem] font-medium text-ink-600 transition-colors duration-200 hover:border-gold-200 hover:bg-gold-50 hover:text-gold-700"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <div className="mx-auto max-w-md text-center">
              <p className="text-sm text-ink-500">لا توجد نتائج للبحث عن «{query}»</p>

              {didYouMean && (
                <p className="mt-3 text-sm text-ink-600">
                  هل تقصد{' '}
                  <button
                    type="button"
                    onClick={() => run(didYouMean)}
                    className="font-medium text-gold-700 underline decoration-gold-300 decoration-2 underline-offset-4"
                  >
                    {didYouMean}
                  </button>
                  ؟
                </p>
              )}

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="secondary" onClick={() => run('')}>
                  عرض الكل
                </Button>
                <Button href="/questions" variant="ink">
                  اطرح سؤالك
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** What kind of thing a hit is, so the reader can tell a guide from a fatwa. */
function labelFor(hit) {
  if (hit.kind === 'article') return 'فتوى';
  if (hit.kind === 'service') return 'خدمة';
  return silos[hit.silo]?.short ?? 'دليل';
}
