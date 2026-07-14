import Image from 'next/image';
import Link from 'next/link';
import portrait from '../../public/images/profile/almazon1.jpg';
import Seo, {
  faqSchema,
  graph,
  localBusinessSchema,
  personSchema,
  webSiteSchema,
} from '@/components/Seo';
import Button from '@/components/ui/Button';
import Accordion from '@/components/ui/Accordion';
import Reveal from '@/components/Reveal';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import ContactChannels from '@/components/ContactChannels';
import RequiredDocuments from '@/components/RequiredDocuments';
import OfficeLocation from '@/components/OfficeLocation';
import SocialIcon from '@/components/layout/SocialIcon';
import { about, faqs, site, trustSignals, whyUs } from '@/lib/site';
// The leaf modules, not `@/content` — importing the index here would pull the
// full text of all 18 guides and the search index into the homepage bundle to
// render five service cards and six silo links.
import { services as servicePages } from '@/content/services';
import { siloList } from '@/content/silos';

const pagePath = (page) => `/services/${page.slug}`;

export default function Home() {
  return (
    <>
      {/* The homepage carries the full entity graph. Every other page references
          these nodes by @id instead of re-declaring the business. */}
      <Seo
        jsonLd={graph(
          localBusinessSchema(),
          personSchema(),
          webSiteSchema(),
          faqSchema(faqs),
        )}
      />

      <Hero />
      <TrustStrip />
      <Services />
      {/* Directly after the services: the visitor has just read what will be done
          for them, and the next thing they need is what to bring. */}
      <RequiredDocuments />
      <Guides />
      <WhyUs />
      <About />
      <Faq />
      <Contact />
      <OfficeLocation />
      {/* Examples only, and last — never the page's subject. */}
      <ExampleAreas />
      <ClosingCta />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <Section as="div" spacing="loose" className="relative overflow-hidden pt-10 sm:pt-14">
      {/* One very soft radial wash. No gradient text, no colour blocks. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,rgba(166,124,61,0.07),transparent_70%)]"
        aria-hidden="true"
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-surface px-3 py-1.5 text-xs font-medium text-ink-600 shadow-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden="true" />
                {`مأذون معتمد — ${site.address.serviceNote}`}
              </span>
            </Reveal>

            <Reveal delay={60}>
              {/* The H1 names the service, not a place. The business is mobile and
                  is deliberately not tied to any governorate. */}
              <h1 className="mt-6 text-balance text-[2.125rem] font-semibold leading-[1.25] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.2]">
                مأذون شرعي
                <span className="block text-gold-600">لكتب الكتاب وتوثيق عقد الزواج</span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 max-w-xl text-base leading-[2] text-ink-500 sm:text-lg">
                {site.fullName} — {site.credentials}. كتب كتاب وعقد قران وتوثيق رسمي بالمحكمة
                واستخراج قسيمة الزواج. {site.address.coverage}، وخدمات داخل القاهرة والجيزة
                والقليوبية عند الحاجة.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href={site.phone.href} variant="ink" size="lg">
                  <SocialIcon name="phone" className="h-[1.125rem] w-[1.125rem]" />
                  اتصل الآن
                </Button>
                <Button href={site.whatsapp.href} variant="secondary" size="lg">
                  <SocialIcon name="whatsapp" />
                  تواصل عبر واتساب
                </Button>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <p className="mt-7 text-sm text-ink-500">
                أو{' '}
                <Link
                  href="/questions"
                  className="font-medium text-ink-800 underline decoration-gold-300 decoration-2 underline-offset-4 transition-colors hover:text-gold-700"
                >
                  اطرح سؤالك على المأذون
                </Link>{' '}
                وسيتم الرد عليه ونشره.
              </p>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Offset frame — a hairline, not the old solid black block. */}
              <div
                className="absolute -bottom-3 -start-3 h-full w-full rounded-3xl border border-gold-200"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-surface shadow-lift">
                <Image
                  src={portrait}
                  alt={`${site.fullName} — ${site.title}`}
                  className="h-auto w-full object-cover"
                  // This is the LCP element; it must not be lazy-loaded.
                  priority
                  sizes="(max-width: 1024px) 384px, 40vw"
                  placeholder="blur"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Trust signals, not statistics.
 *
 * A legal service that invents "٥٠٠٠ عقد موثّق" to fill a stat row has already
 * lied to the visitor before it has done anything for them. Every value below is
 * a fact drawn from the Ma'zoun's credentials or the service definition itself.
 */
function TrustStrip() {
  return (
    <Section
      spacing="tight"
      className="border-y border-ink-100 bg-surface"
      aria-labelledby="trust-heading"
    >
      <Container>
        {/* The section needs an h2, or the outline jumps h1 → h3 and both the
            heading hierarchy and a screen reader's section list break. It carries
            no visual weight here, so it is visually hidden rather than invented. */}
        <h2 id="trust-heading" className="sr-only">
          لماذا تثق بالمأذون
        </h2>

        <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {trustSignals.map((item, i) => (
            <Reveal as="li" key={item.label} delay={i * 70}>
              <p className="text-[1.75rem] font-semibold leading-none tracking-tight text-gold-600">
                {item.value}
              </p>
              <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-900">{item.label}</h3>
              <p className="mt-1.5 text-sm leading-[1.9] text-ink-500">{item.detail}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The services grid.
 *
 * These were static cards — the service names were on the homepage as text, and
 * pointed nowhere. Now each card is a link to that service's own page, which is
 * what turns the homepage into the root of the silo instead of a leaf that happens
 * to mention the services by name. The homepage is the most-linked page on any
 * site; the links it hands out are the most valuable ones it has to give.
 */
function Services() {
  return (
    <Section id="services" aria-labelledby="services-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="services-heading"
            eyebrow="الخدمات"
            title="ما الذي يمكن للمأذون إتمامه لك"
            lede="جميع الإجراءات تتم وفق أحكام الشريعة الإسلامية وقانون الأحوال الشخصية المصري."
          />
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {servicePages.map((service, i) => (
            <Reveal as="li" key={service.slug} delay={(i % 3) * 70} className="h-full">
              <Link
                href={pagePath(service)}
                className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-surface p-6 shadow-subtle transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-1 hover:shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-100 text-sm font-semibold text-ink-500 transition-colors duration-300 group-hover:border-gold-200 group-hover:bg-gold-50 group-hover:text-gold-600">
                  <span className="ltr-nums">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-semibold text-ink-900 transition-colors duration-200 group-hover:text-gold-700">
                  {service.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-[1.9] text-ink-500">
                  {service.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600">
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
  );
}

/**
 * The guides, by silo.
 *
 * The homepage's one link into the informational half of the site. Without it the
 * guides hang off `/guides` alone, and the topical structure the whole site is
 * built around is invisible from its most important page.
 */
function Guides() {
  return (
    <Section className="bg-surface" aria-labelledby="guides-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="guides-heading"
            eyebrow="الأدلة"
            title="اعرف حقوقك قبل أن توقّع"
            lede="أدلة مختصرة في الزواج والتوثيق والمهر والحقوق والطلاق — مكتوبة لتُجيب على سؤالك، لا لتُطيل."
          />
        </Reveal>

        <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siloList.map((silo, i) => (
            <Reveal as="li" key={silo.id} delay={(i % 3) * 60}>
              <Link
                href="/guides"
                className="group flex h-full items-center justify-between gap-3 rounded-xl border border-ink-100 bg-paper px-5 py-4 transition-colors duration-200 hover:border-gold-200 hover:bg-gold-50"
              >
                <span className="text-[0.9375rem] font-medium text-ink-800 transition-colors group-hover:text-gold-700">
                  {silo.title}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-ink-300 transition-transform duration-300 ease-premium group-hover:-translate-x-1 group-hover:text-gold-600"
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
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={140} className="mt-10 text-center">
          <Button href="/guides" variant="secondary">
            تصفّح كل الأدلة
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Example service areas.
 *
 * Illustrations, not a location claim — and deliberately not an SEO target. They
 * sit at the very end of the page, below everything that matters, and are named
 * as examples in the copy. No governorate is claimed anywhere, the business has
 * no fixed office, and none of these areas appear in the structured data as the
 * business's address.
 *
 * They are plain list items rather than headings, so they add no weight to the
 * heading outline and cannot read as the page's subject.
 */
function ExampleAreas() {
  return (
    <Section spacing="tight" className="bg-surface" aria-labelledby="areas-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="areas-heading"
            eyebrow="نطاق الخدمة"
            title="خدمة متنقلة حسب الاتفاق"
            lede="يخدم المأذون مختلف مناطق القاهرة الكبرى، مع خدمات داخل القاهرة والجيزة والقليوبية عند الحاجة — يحضر إلى المنزل أو القاعة أو المكتب في الموعد الذي يناسبك."
          />
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <div className="mx-auto max-w-2xl rounded-2xl border border-ink-100 bg-paper p-6 text-center shadow-subtle">
            <p className="text-sm font-medium text-ink-500">
              أمثلة على مناطق سبق خدمتها
            </p>

            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {site.address.exampleAreas.map((area) => (
                <li
                  key={area}
                  className="inline-flex items-center rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-[0.8125rem] font-medium text-ink-600"
                >
                  {area}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-[1.9] text-ink-500">
              القائمة على سبيل المثال لا الحصر. للاستفسار عن منطقتك، اتصل على{' '}
              <a
                href={site.phone.href}
                className="font-medium text-ink-800 underline decoration-gold-300 decoration-2 underline-offset-4 transition-colors hover:text-gold-700"
              >
                <span className="ltr-nums">{site.phone.display}</span>
              </a>
              .
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function WhyUs() {
  return (
    <Section className="bg-surface" aria-labelledby="why-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="why-heading"
            eyebrow="لماذا المأذون البحراوي"
            title="ما الذي يجعل التوثيق معنا مختلفًا"
            lede="عقد الزواج وثيقة تحكم حياة كاملة. الفارق يظهر في التفاصيل التي لا يلتفت إليها غيرنا."
          />
        </Reveal>

        <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {whyUs.map((item, i) => (
            <Reveal as="div" key={item.title} delay={(i % 3) * 70} className="flex gap-4">
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]">
                  <path
                    d="m5 13 4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <h3 className="text-[1.0625rem] font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-[1.95] text-ink-500">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function About() {
  return (
    <Section aria-labelledby="about-heading">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              id="about-heading"
              align="start"
              eyebrow={about.title}
              title={about.heading}
            />

            <div className="mt-6 space-y-4">
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-[2] text-ink-500">
                  {paragraph}
                </p>
              ))}
            </div>

            <ul className="mt-8 flex flex-wrap gap-2">
              {about.credentials.map((credential) => (
                <li
                  key={credential}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-surface px-3.5 py-2 text-[0.8125rem] font-medium text-ink-700 shadow-subtle"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden="true" />
                  {credential}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* A pull-quote rather than a second portrait: the face is already the
              hero, and repeating it here would read as filler. */}
          <Reveal delay={100} className="lg:col-span-6">
            <figure className="relative overflow-hidden rounded-3xl border border-ink-100 bg-surface p-8 shadow-card sm:p-10">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(166,124,61,0.08),transparent_70%)]"
                aria-hidden="true"
              />
              <span className="relative block text-5xl leading-none text-gold-200" aria-hidden="true">
                ”
              </span>
              <blockquote className="relative mt-4">
                <p className="text-lg leading-[1.95] text-ink-700 sm:text-xl">
                  عقد الزواج ليس ورقة تُوقَّع وتُنسى — هو الوثيقة التي تُحفظ بها الحقوق يوم يُنسى كل
                  ما عداها. ولهذا لا أوثّق عقدًا حتى يفهم طرفاه كل بند فيه.
                </p>
              </blockquote>
              <figcaption className="relative mt-6 border-t border-ink-100 pt-5">
                <p className="text-[0.9375rem] font-semibold text-ink-900">{site.fullName}</p>
                <p className="mt-1 text-sm text-ink-500">{site.title}</p>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function Faq() {
  return (
    <Section className="bg-surface" aria-labelledby="faq-heading">
      <Container size="narrow">
        <Reveal>
          <SectionHeading
            id="faq-heading"
            eyebrow="الأسئلة الشائعة"
            title="إجابات على أكثر ما يُسأل عنه"
            lede="لم تجد سؤالك؟ اترك سؤالك وسيتم الرد عليه ونشره في صفحة الأسئلة."
          />
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Accordion items={faqs} />
        </Reveal>

        <Reveal delay={140} className="mt-8 text-center">
          <Button href="/questions" variant="secondary">
            اطرح سؤالك على المأذون
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Contact and location in one section.
 *
 * The site used to devote a whole band to *advertising* that WhatsApp exists.
 * A channel is not a feature to sell — it is a link to open, so every channel
 * here is one tap: `tel:` dials, `wa.me` opens the chat, the rest open the
 * profile.
 */
function Contact() {
  return (
    <Section id="contact" className="scroll-mt-24" aria-labelledby="contact-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="contact-heading"
            eyebrow="تواصل"
            title="تواصل مع المأذون مباشرة"
            lede="اختر الوسيلة التي تناسبك — تصلك مباشرة إلى المأذون، بلا وسيط وبلا نماذج."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <ContactChannels />
        </Reveal>

        {/* The office and its map are the section immediately below. This line
            stays because the office is where you can *meet* him — the service
            itself still travels to you, and that is what a visitor needs to know
            before they assume they have to come to a counter. */}
        <Reveal delay={140} className="mt-12">
          <p className="mx-auto max-w-2xl text-center text-sm leading-[1.9] text-ink-500">
            المأذون متنقل ويعمل حسب الاتفاق — يحضر إلى المنزل أو القاعة أو المكتب في الموعد الذي
            يناسبك، دون الحاجة إلى الانتقال إلى مقر.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function ClosingCta() {
  return (
    <Section spacing="tight" className="pb-20 sm:pb-24">
      <Container>
        <Reveal>
          <div className="on-dark relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(166,124,61,0.22),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                لديك سؤال أو تحتاج إلى توثيق عقد؟
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-[1.9] text-ink-300">
                تواصل مباشرة مع المأذون الشرعي، أو اترك سؤالك ليُجاب عنه وتُنشر إجابته للجميع.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href={site.phone.href} variant="primary" size="lg">
                  <SocialIcon name="phone" className="h-[1.125rem] w-[1.125rem]" />
                  اتصل الآن
                </Button>
                <Button href="/questions" variant="inverse" size="lg">
                  اترك سؤالك
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
