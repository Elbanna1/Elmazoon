import Link from 'next/link';
import Seo, { breadcrumbSchema, entityGraph, graph, itemListSchema } from '@/components/Seo';
import Reveal from '@/components/Reveal';
import Button from '@/components/ui/Button';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { contentIssues, pagePath, pagesInSilo, pagesOfKind, siloList } from '@/content';

/**
 * The guides hub — the top of the informational silo.
 *
 * Its job is link equity distribution, not decoration. Every guide on the site is
 * one click from here and one click from its silo's neighbours, which is what
 * makes a 23-page site crawl like a structured body of work instead of a pile of
 * unrelated posts. A guide that this page does not list is a guide Google has to
 * find some other way.
 */
export async function getStaticProps() {
  /**
   * The content audit runs at build time and prints to the build log.
   *
   * Broken `related` slugs, orphan pages, over-long titles and thin content are
   * all invisible in the rendered page and all cost ranking. Surfacing them here
   * means they are caught in the build that introduced them rather than in Search
   * Console six weeks later. Warnings do not fail the build; errors are loud.
   */
  const issues = contentIssues();

  if (issues.length > 0) {
    const errors = issues.filter((issue) => issue.level === 'error');
    const warnings = issues.filter((issue) => issue.level === 'warn');

    console.log(`\n[content] ${errors.length} خطأ، ${warnings.length} تحذير`);
    for (const issue of issues) {
      console.log(`  ${issue.level === 'error' ? '✗' : '•'} ${issue.at}: ${issue.message}`);
    }
    console.log('');
  }

  const silos = siloList
    .map((silo) => ({
      ...silo,
      pages: pagesInSilo(silo.id)
        .filter((page) => page.kind === 'guide')
        .map((page) => ({
          slug: page.slug,
          title: page.title,
          description: page.description,
          path: pagePath(page),
        })),
    }))
    // A silo with no guides in it is not a section, it is an empty heading.
    .filter((silo) => silo.pages.length > 0);

  return { props: { silos } };
}

export default function GuidesHub({ silos }) {
  const all = silos.flatMap((silo) => silo.pages);

  return (
    <>
      <Seo
        title="الأدلة الشرعية والقانونية"
        description="أدلة المأذون الشرعي: شروط صحة عقد الزواج، والمهر وقائمة المنقولات، وحقوق الزوجة والزوج، والطلاق والرجعة والعدة، والزواج العرفي وإثبات الزواج."
        jsonLd={graph(
          entityGraph(),
          itemListSchema(
            all.map((page) => ({ name: page.title, path: page.path })),
            { path: '/guides', name: 'الأدلة الشرعية والقانونية' },
          ),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الأدلة', path: '/guides' },
          ]),
        )}
      />

      <Section spacing="tight" className="pt-12 sm:pt-16">
        <Container>
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="الأدلة"
              title="الأدلة الشرعية والقانونية"
              lede="كل ما يحتاج المقبل على الزواج — أو المارّ بطلاق — أن يعرفه قبل أن يوقّع أو يتلفّظ. مرتّبة بالموضوع، ومكتوبة لتُجيب لا لتُطيل."
            />
          </Reveal>
        </Container>
      </Section>

      <Section spacing="tight" className="pb-20 pt-0 sm:pb-24">
        <Container>
          <div className="space-y-14">
            {silos.map((silo, siloIndex) => (
              <Reveal key={silo.id} delay={Math.min(siloIndex, 4) * 60}>
                {/* Each silo is a real <section> with its own h2, so the page
                    outline mirrors the topical structure exactly. */}
                <section aria-labelledby={`silo-${silo.id}`}>
                  <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
                    <h2
                      id={`silo-${silo.id}`}
                      className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl"
                    >
                      {silo.title}
                    </h2>
                    <p className="text-sm leading-[1.9] text-ink-500">{silo.description}</p>
                  </div>

                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {silo.pages.map((page) => (
                      <li key={page.slug}>
                        <Link
                          href={page.path}
                          className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-surface p-5 shadow-subtle transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-1 hover:shadow-card"
                        >
                          <h3 className="text-[1.0625rem] font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-gold-700">
                            {page.title}
                          </h3>
                          <p className="mt-2.5 line-clamp-3 text-sm leading-[1.9] text-ink-500">
                            {page.description}
                          </p>
                          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600">
                            اقرأ الدليل
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:-translate-x-1"
                              aria-hidden="true"
                            >
                              <path
                                d="M19 12H5m0 0 6-6m-6 6 6 6"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 text-center">
            <p className="text-sm text-ink-500">لم تجد ما تبحث عنه؟</p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/questions" variant="secondary">
                اطرح سؤالك على المأذون
              </Button>
              <Button href="/articles" variant="ghost">
                تصفّح الفتاوى
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
