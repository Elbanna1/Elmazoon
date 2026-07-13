import Link from 'next/link';
import Button from '@/components/ui/Button';
import Accordion from '@/components/ui/Accordion';
import { Container, Section } from '@/components/ui/Layout';
import SocialIcon from '@/components/layout/SocialIcon';
import ShareRow from './ShareRow';
import TableOfContents from './TableOfContents';
import { pagePath, readingMinutes, silos } from '@/content';
import { site } from '@/lib/site';

/**
 * One renderer for every guide and every service page.
 *
 * The heading outline is the whole point of this component, and it is enforced
 * here rather than left to whoever writes the next page: the page title is the
 * only `h1`, every section heading is an `h2` carrying the `id` its table-of-
 * contents entry links to, "الأسئلة الشائعة" is an `h2` and each question inside
 * the accordion is an `h3`. A page cannot skip a level, because no page chooses
 * its own levels.
 *
 * Everything the brief asks each article to carry — breadcrumb, table of contents,
 * FAQ, author, last-updated, reading time, share, related — is here once, so it is
 * on every page by construction rather than by discipline.
 */
export default function ContentPage({ page, related = [] }) {
  const silo = silos[page.silo];
  const minutes = readingMinutes(page);
  const url = `${site.url}${pagePath(page)}`;
  const isService = page.kind === 'service';
  const root = isService ? { name: 'الخدمات', path: '/services' } : { name: 'الأدلة', path: '/guides' };

  return (
    <>
      <Section spacing="tight" className="pt-8 sm:pt-10">
        <Container size="narrow">
          <Breadcrumb trail={[{ name: 'الرئيسية', path: '/' }, root, { name: page.title }]} />

          <article>
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                {silo?.title ?? ''}
              </p>

              <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
                {page.title}
              </h1>

              {/* Author, last-updated and reading time. Not decoration: these are
                  the E-E-A-T signals Google reads off a page about legal and
                  religious rulings, and the ones a reader uses to decide whether
                  to trust it. */}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
                <span>
                  بقلم{' '}
                  <span className="font-medium text-ink-700">{site.fullName}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{site.title}</span>
                <span aria-hidden="true">·</span>
                <span>
                  آخر تحديث{' '}
                  <time dateTime={page.updated} className="ltr-nums">
                    {new Date(page.updated).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  قراءة <span className="ltr-nums">{minutes}</span> دقائق
                </span>
              </div>

              {/* The answer, first. This paragraph exists to be the featured
                  snippet — it answers the page's question before any preamble. */}
              <p className="mt-8 border-s-2 border-gold-300 ps-5 text-[1.0625rem] font-medium leading-[2] text-ink-700">
                {page.lede}
              </p>
            </header>

            <TableOfContents sections={page.sections} />

            {page.sections.map((section) => (
              <section key={section.id} className="mt-10 first:mt-0">
                {/* scroll-mt clears the sticky header, or a heading jumped to
                    from the TOC lands underneath it and appears not to have
                    moved at all. */}
                <h2
                  id={section.id}
                  className="scroll-mt-24 text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
                >
                  {section.heading}
                </h2>

                <div className="mt-4 max-w-prose space-y-4">
                  {(section.body ?? []).map((paragraph) => (
                    <p key={paragraph} className="text-[1.0625rem] leading-[2.1] text-ink-700">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.list?.length > 0 && (
                  <ul className="mt-5 max-w-prose space-y-3">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400"
                          aria-hidden="true"
                        />
                        <span className="text-[1.0625rem] leading-[1.95] text-ink-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.note && (
                  <aside
                    role="note"
                    className="mt-6 max-w-prose rounded-xl border border-gold-200 bg-gold-50 p-5"
                  >
                    <p className="text-[0.9375rem] leading-[1.95] text-ink-700">{section.note}</p>
                  </aside>
                )}
              </section>
            ))}
          </article>

          {page.faqs?.length > 0 && (
            <section className="mt-16" aria-labelledby="faq-heading">
              <h2
                id="faq-heading"
                className="scroll-mt-24 text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
              >
                الأسئلة الشائعة
              </h2>
              {/* Accordion renders each question as an h3, so the outline holds. */}
              <div className="mt-6">
                <Accordion items={page.faqs} />
              </div>
            </section>
          )}

          <ReviewNotice notes={page.review} />

          <Cta isService={isService} />

          <ShareRow title={page.title} url={url}>
            <Button href={root.path} variant="ghost">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M19 12H5m0 0 6-6m-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              كل {root.name}
            </Button>
          </ShareRow>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section
          spacing="tight"
          className="border-t border-ink-100 bg-surface pb-20 sm:pb-24"
          aria-labelledby="related-heading"
        >
          <Container size="narrow">
            <h2
              id="related-heading"
              className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
            >
              اقرأ أيضًا
            </h2>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={pagePath(item)}
                    className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-paper p-5 transition-shadow duration-300 ease-premium hover:shadow-card"
                  >
                    <span className="text-xs font-medium text-gold-600">
                      {silos[item.silo]?.short}
                    </span>
                    <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-gold-700">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-[1.85] text-ink-500">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The visible breadcrumb.
 *
 * Mirrors the BreadcrumbList in the structured data exactly. Google cross-checks
 * the two, and a breadcrumb schema that describes a trail the page does not
 * actually render is a mismatch it can and does ignore the schema over.
 *
 * The last crumb is the current page: `aria-current`, and not a link — linking a
 * page to itself is a dead control.
 */
function Breadcrumb({ trail }) {
  return (
    <nav aria-label="مسار التنقل" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;

          return (
            <li key={crumb.name} className="flex items-center gap-2">
              {isLast ? (
                // `line-clamp-1` so a long Arabic title cannot push the row wide
                // enough to scroll the page sideways on a 320px screen.
                <span aria-current="page" className="line-clamp-1 text-ink-700">
                  {crumb.name}
                </span>
              ) : (
                <>
                  {/* min-h-6 (24px): a breadcrumb is a navigation list, so WCAG
                      2.5.8's exception for links inside a sentence does not apply
                      to it. These were 20px tall. */}
                  <Link
                    href={crumb.path}
                    className="inline-flex min-h-6 items-center transition-colors hover:text-ink-700"
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The pending-review banner.
 *
 * Rendered **only outside production**. Every claim on these pages that depends
 * on a fee, a document list, or a numbered article of law is written
 * conservatively and listed in the page's `review` array; this surfaces that list
 * to whoever is running the site locally, so the gaps are visible while the
 * content is being finished rather than discovered by a reader.
 *
 * It must never reach a visitor — a public page carrying its own editorial
 * to-do list is worse than one that simply says less.
 */
function ReviewNotice({ notes }) {
  if (process.env.NODE_ENV === 'production' || !notes?.length) return null;

  return (
    <aside className="mt-12 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-900">
        بانتظار مراجعة المأذون — لا يظهر هذا التنبيه في النسخة المنشورة
      </p>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li key={note} className="text-[0.8125rem] leading-[1.9] text-amber-900">
            • {note}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** The conversion step. A guide earns the call; a service page asks for it. */
function Cta({ isService }) {
  return (
    <aside className="mt-16 rounded-2xl border border-ink-100 bg-surface p-6 shadow-subtle sm:p-8">
      <h2 className="text-lg font-semibold text-ink-900">
        {isService ? 'لتحديد موعد أو الاستفسار' : 'لم تجد إجابة سؤالك؟'}
      </h2>
      <p className="mt-2 text-[0.9375rem] leading-[1.95] text-ink-500">
        {isService
          ? 'تواصل مباشرة مع المأذون — تُشرح لك الأوراق والإجراءات قبل الموعد، دون مفاجآت.'
          : 'الأحكام تختلف باختلاف تفاصيل كل حالة. اسأل المأذون عن حالتك بعينها، أو اطرح سؤالك ليُجاب عنه ويُنشر.'}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href={site.phone.href} variant="ink">
          <SocialIcon name="phone" className="h-[1.125rem] w-[1.125rem]" />
          اتصل الآن
        </Button>
        <Button href={site.whatsapp.href} variant="secondary">
          <SocialIcon name="whatsapp" />
          واتساب
        </Button>
        {!isService && (
          <Button href="/questions" variant="ghost">
            اطرح سؤالك
          </Button>
        )}
      </div>
    </aside>
  );
}
