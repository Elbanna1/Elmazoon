import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo, { articleSchema, breadcrumbSchema, graph } from '@/components/Seo';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ArticleCard from '@/components/ArticleCard';
import ReadingProgress from '@/components/ReadingProgress';
import Comments from '@/components/Comments';
import { Container, Section } from '@/components/ui/Layout';
import SocialIcon from '@/components/layout/SocialIcon';
import { api, articleImage, endpoints, toMessage } from '@/lib/api';
import { site } from '@/lib/site';

const RELATED_COUNT = 3;

/**
 * Server-rendered on first request, then cached and revalidated.
 *
 * The old page did all three of these on the client, on every view:
 *   1. GET /api/articles/:id
 *   2. GET /uploads/:image        (to read the redirect URL off the response)
 *   3. GET /uploads/:articleId    (a bug — the *article id* used as a filename,
 *                                  guaranteeing a 404 on every single page view)
 * The image URL is derivable, so 2 and 3 are gone entirely.
 */
export async function getStaticPaths() {
  // Nothing is pre-rendered at build time — the backend may be unreachable, and
  // failing the build over it would be worse than rendering on first request.
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  try {
    const { data } = await api.get(endpoints.article(params.singleArticle));
    if (!data?._id) return { notFound: true, revalidate: 60 };

    // Related fatwas plus the previous/next pair, resolved at build/revalidate
    // time so the reader never waits on a second request — and so they land in
    // the HTML as real internal links, which is most of their SEO value.
    //
    // The backend has no "adjacent article" endpoint and no ordering parameter,
    // but `get-articles` is documented as newest-first, so position in that list
    // *is* the chronology. One request answers both questions.
    let related = [];
    let prev = null;
    let next = null;

    try {
      const { data: list } = await api.get(endpoints.articles, {
        params: { page: 1, limit: 50 },
      });
      const all = list?.articles ?? [];
      const index = all.findIndex((a) => a._id === data._id);

      // Newest-first: the *newer* article sits at a lower index.
      const slim = (a) =>
        a ? { _id: a._id, title: a.title } : null;

      if (index !== -1) {
        next = slim(all[index - 1]); // newer
        prev = slim(all[index + 1]); // older
      }

      related = all
        .filter((a) => a._id !== data._id)
        .slice(0, RELATED_COUNT)
        // Drop the body: the card only shows an excerpt, and shipping full
        // article text for three cards bloats the page payload for nothing.
        .map((a) => ({
          _id: a._id,
          title: a.title,
          image: articleImage(a),
          excerpt: (a.content || '').trim().slice(0, 200),
        }));
    } catch {
      // No related list is a degraded page, not a broken one.
    }

    return { props: { article: data, related, prev, next, error: null }, revalidate: 300 };
  } catch (error) {
    if (error?.response?.status === 404) return { notFound: true, revalidate: 60 };
    // Backend down: render the shell with an error rather than a 500.
    return {
      props: { article: null, related: [], prev: null, next: null, error: toMessage(error) },
      revalidate: 30,
    };
  }
}

export default function ArticlePage({ article, related = [], prev, next, error }) {
  const router = useRouter();
  const articleRef = useRef(null);
  const articleId = article?._id;

  /**
   * Count the view.
   *
   * Fired once per mount, from the client, so a build-time prerender does not
   * register a view nobody made. The backend de-duplicates against the visitor
   * cookie (`counted` in the response says whether it took), so a refresh does
   * not inflate the number — which is why this does not try to be clever about it.
   */
  useEffect(() => {
    if (!articleId) return;
    api.post(endpoints.articleView(articleId)).catch(() => {
      /* A view that fails to record is not worth interrupting the reader for. */
    });
  }, [articleId]);

  // fallback: 'blocking' means this only shows on an on-demand revalidation.
  if (router.isFallback) return <ArticleSkeletonView />;

  if (!article) {
    return (
      <>
        <Seo title="الفتوى" noindex />
        <Section>
          <Container size="narrow" className="text-center">
            <h1 className="text-2xl font-semibold text-ink-900">تعذّر تحميل الفتوى</h1>
            <p className="mt-3 text-ink-500">{error}</p>
            <Button href="/articles" variant="secondary" className="mt-8">
              العودة إلى الفتاوى
            </Button>
          </Container>
        </Section>
      </>
    );
  }

  const src = articleImage(article);
  const excerpt = (article.content || '').trim().slice(0, 160);
  const shareUrl = `${site.url}/articles/${article._id}`;
  const words = countWords(article.content);
  const minutes = readingMinutes(article.content);

  return (
    <>
      <Seo
        title={article.title}
        // The old page used the article *body* as its <title> and description.
        description={excerpt}
        image={src || undefined}
        type="article"
        publishedAt={article.createdAt}
        modifiedAt={article.updatedAt || article.createdAt}
        jsonLd={graph(
          articleSchema(article, { wordCount: words, readingMinutes: minutes }),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الفتاوى', path: '/articles' },
            { name: article.title, path: `/articles/${article._id}` },
          ]),
        )}
      />

      <ReadingProgress targetRef={articleRef} />

      <Section spacing="tight" className="pt-8 sm:pt-10">
        <Container size="narrow">
          <nav aria-label="مسار التنقل" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-ink-400">
              <li>
                <Link href="/" className="transition-colors hover:text-ink-700">
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/articles" className="transition-colors hover:text-ink-700">
                  الفتاوى
                </Link>
              </li>
            </ol>
          </nav>

          <article ref={articleRef}>
            <header>
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
                {article.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-400">
                <span>{site.fullName}</span>

                {article.createdAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={article.createdAt} className="ltr-nums">
                      {new Date(article.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </>
                )}

                <span aria-hidden="true">·</span>
                <span>
                  قراءة <span className="ltr-nums">{readingMinutes(article.content)}</span> دقائق
                </span>

                <span aria-hidden="true">·</span>
                <span>
                  <span className="ltr-nums">{(article.views ?? 0).toLocaleString('ar-EG')}</span>{' '}
                  مشاهدة
                </span>

                {article.commentCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <span className="ltr-nums">{article.commentCount}</span> تعليق
                    </span>
                  </>
                )}
              </div>
            </header>

            {src && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-ink-100 bg-ink-50 shadow-card">
                <Image
                  src={src}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                  className="object-cover"
                />
              </div>
            )}

            {/* max-w-prose keeps the measure readable — Arabic body text past
                ~70 characters per line becomes hard to track. */}
            <div className="mt-10 max-w-prose">
              <p className="whitespace-pre-line text-[1.0625rem] leading-[2.1] text-ink-700">
                {article.content}
              </p>
            </div>
          </article>

          <ShareRow title={article.title} url={shareUrl} />

          <PrevNext prev={prev} next={next} />

          <Comments articleId={article._id} initialCount={article.commentCount ?? 0} />
        </Container>
      </Section>

      {related.length > 0 && (
        <Section
          spacing="tight"
          className="border-t border-ink-100 bg-surface pb-20 sm:pb-24"
          aria-labelledby="related-heading"
        >
          <Container>
            <h2
              id="related-heading"
              className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
            >
              فتاوى ذات صلة
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard
                  key={item._id}
                  id={item._id}
                  title={item.title}
                  content={item.excerpt}
                  image={item.image}
                  headingLevel="h3"
                />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Share buttons.
 *
 * Every one is a plain link to the platform's own share URL — no SDK, no
 * third-party script, no tracking pixel. A share widget that ships 80KB of
 * vendor JS to render four icons is the single most common way an otherwise fast
 * article page loses its Lighthouse score.
 */
function ShareRow({ title, url }) {
  const text = `${title}\n${url}`;

  const targets = [
    {
      name: 'واتساب',
      icon: 'whatsapp',
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      name: 'فيسبوك',
      icon: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'تيليجرام',
      icon: 'telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ];

  return (
    <div className="mt-14 flex flex-col gap-4 border-t border-ink-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <Button href="/articles" variant="ghost">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M19 12H5m0 0 6-6m-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        كل الفتاوى
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-400">شارك الفتوى</span>
        <ul className="flex gap-2">
          {targets.map((target) => (
            <li key={target.name}>
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`شارك عبر ${target.name}`}
                title={`شارك عبر ${target.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-100 bg-surface text-ink-500 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-900"
              >
                <SocialIcon name={target.icon} />
              </a>
            </li>
          ))}
          <li>
            <CopyLinkButton url={url} />
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Copy-to-clipboard, with the check mark as its own confirmation. */
function CopyLinkButton({ url }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard access is denied in insecure contexts. The three share
          // links above still work, so there is nothing worth interrupting for.
        }
      }}
      aria-label={copied ? 'تم نسخ الرابط' : 'انسخ رابط الفتوى'}
      title={copied ? 'تم النسخ' : 'انسخ الرابط'}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-100 bg-surface text-ink-500 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-900"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]" aria-hidden="true">
          <path
            d="m5 13 4 4L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M5 15V6a2 2 0 0 1 2-2h9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * Previous / next fatwa.
 *
 * Keeps a reader moving through the archive instead of bouncing back to Google,
 * and gives every article two more inbound internal links — which is how a deep
 * page gets crawled at all.
 */
function PrevNext({ prev, next }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="التنقل بين الفتاوى" className="mt-10 grid gap-4 sm:grid-cols-2">
      {/* RTL: "previous" (older) sits on the right, which is where `order` puts it. */}
      {prev ? (
        <Link
          href={`/articles/${prev._id}`}
          rel="prev"
          className="group flex flex-col rounded-2xl border border-ink-100 bg-surface p-5 transition-shadow duration-300 ease-premium hover:shadow-card"
        >
          <span className="text-xs font-medium text-ink-400">الفتوى السابقة</span>
          <span className="mt-1.5 line-clamp-2 text-[0.9375rem] font-semibold text-ink-900 transition-colors group-hover:text-gold-700">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      {next && (
        <Link
          href={`/articles/${next._id}`}
          rel="next"
          className="group flex flex-col rounded-2xl border border-ink-100 bg-surface p-5 text-end transition-shadow duration-300 ease-premium hover:shadow-card"
        >
          <span className="text-xs font-medium text-ink-400">الفتوى التالية</span>
          <span className="mt-1.5 line-clamp-2 text-[0.9375rem] font-semibold text-ink-900 transition-colors group-hover:text-gold-700">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */

function countWords(content) {
  return (content || '').trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Reading time.
 *
 * 180 words per minute rather than the usual English 200–250: Arabic is written
 * without short vowels, so a reader does more disambiguation per word. Always at
 * least one minute — "قراءة 0 دقائق" is nonsense.
 */
function readingMinutes(content) {
  return Math.max(1, Math.round(countWords(content) / 180));
}

function ArticleSkeletonView() {
  return (
    <Section spacing="tight" className="pt-8 sm:pt-10">
      <Container size="narrow">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-8 h-9 w-full" />
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-6 h-3.5 w-48" />
        <Skeleton className="mt-8 aspect-[16/9] w-full rounded-2xl" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Container>
    </Section>
  );
}
