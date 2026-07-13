import Link from 'next/link';
import Seo, { breadcrumbSchema, entityGraph, graph, itemListSchema } from '@/components/Seo';
import Reveal from '@/components/Reveal';
import ContactChannels from '@/components/ContactChannels';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { pagePath, pagesOfKind, silos } from '@/content';

/**
 * The services hub.
 *
 * Carries the `LegalService` node as well as the list, because this — not the
 * homepage — is the page whose whole subject is what the business does. The
 * homepage keeps its copy of the node too; they share an `@id`, so Google merges
 * them into one entity rather than seeing two businesses.
 */
export async function getStaticProps() {
  const services = pagesOfKind('service').map((page) => ({
    slug: page.slug,
    title: page.title,
    description: page.description,
    lede: page.lede,
    silo: page.silo,
    path: pagePath(page),
  }));

  return { props: { services } };
}

export default function ServicesHub({ services }) {
  return (
    <>
      <Seo
        title="خدمات المأذون الشرعي"
        description="خدمات المأذون الشرعي: كتب الكتاب وعقد القران، وتوثيق عقد الزواج واستخراج القسيمة، وتوثيق الطلاق والرجعة، وزواج الأجانب، والتصادق وإثبات الزواج."
        jsonLd={graph(
          // The full entity graph: the LegalService node names its `founder` by
          // @id, so the Person node has to travel with it.
          entityGraph(),
          itemListSchema(
            services.map((service) => ({ name: service.title, path: service.path })),
            { path: '/services', name: 'خدمات المأذون الشرعي' },
          ),
          breadcrumbSchema([
            { name: 'الرئيسية', path: '/' },
            { name: 'الخدمات', path: '/services' },
          ]),
        )}
      />

      <Section spacing="tight" className="pt-12 sm:pt-16">
        <Container>
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="الخدمات"
              title="خدمات المأذون الشرعي"
              lede="كل إجراء يتولّاه المأذون، وما الذي يعنيه فعليًا — قبل أن تحتاج إليه."
            />
          </Reveal>
        </Container>
      </Section>

      <Section spacing="tight" className="pt-0">
        <Container>
          <ul className="grid gap-5 md:grid-cols-2">
            {services.map((service, i) => (
              <Reveal as="li" key={service.slug} delay={Math.min(i, 4) * 70} className="h-full">
                <Link
                  href={service.path}
                  className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-surface p-6 shadow-subtle transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-1 hover:shadow-card sm:p-7"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                    {silos[service.silo]?.short}
                  </span>

                  <h2 className="mt-3 text-xl font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-gold-700">
                    {service.title}
                  </h2>

                  <p className="mt-3 flex-1 text-[0.9375rem] leading-[1.95] text-ink-500">
                    {service.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600">
                    تفاصيل الخدمة
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
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section spacing="tight" className="pb-20 sm:pb-24" aria-labelledby="services-contact">
        <Container>
          <Reveal>
            <SectionHeading
              id="services-contact"
              eyebrow="تواصل"
              title="تواصل مع المأذون مباشرة"
              lede="بلا وسيط وبلا نماذج — تُشرح لك الأوراق والإجراءات قبل الموعد."
            />
          </Reveal>
          <Reveal delay={80} className="mt-12">
            <ContactChannels />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
