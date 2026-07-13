import Head from 'next/head';
import { useRouter } from 'next/router';
import { services, site } from '@/lib/site';
import { articlePath } from '@/lib/slug';

/**
 * Every meta tag and every schema the site emits.
 *
 * Two deliberate omissions, both of which would *cost* ranking rather than earn it:
 *
 *  - **No `hreflang="en"`.** There is no English version of any page. Declaring
 *    one that 404s is a hard error in Search Console, so only `ar` and
 *    `x-default` are emitted — both pointing at the Arabic page, which is what
 *    they should point at.
 *
 *  - **No `<meta name="keywords">`.** Google has ignored it since 2009 and Bing
 *    treats stuffing it as a negative signal. The keywords are earned by the
 *    content and the headings, not declared in a tag.
 */
export default function Seo({
  title,
  description = site.description,
  image = '/images/profile/banner-almazoon.png',
  type = 'website',
  noindex = false,
  publishedAt,
  modifiedAt,
  jsonLd,
}) {
  const router = useRouter();
  const path = router.asPath.split('?')[0].split('#')[0];

  /**
   * The canonical URL, percent-encoded exactly once.
   *
   * Arabic slugs make this a real hazard rather than a theoretical one. Depending
   * on how the visitor arrived, `asPath` may hold the Arabic literally
   * (`/guides/المهر`) or already percent-encoded (`/guides/%D8%A7%D9%84%D9%85...`).
   * Emitting whichever one happened to arrive means the same page advertises two
   * different canonicals, and re-encoding an already-encoded path turns every `%`
   * into `%25` — a URL that 404s.
   *
   * Decoding first and then encoding once collapses both inputs to the same
   * output, which is the entire job of a canonical tag.
   */
  const canonical = `${site.url}${path === '/' ? '' : encodeURI(safeDecode(path))}`;
  const fullTitle = title ? `${title} | ${site.name}` : site.defaultTitle;
  const absoluteImage = image.startsWith('http') ? image : `${site.url}${image}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Arabic-only site. x-default points at the same page, not a language picker. */}
      <link rel="alternate" hrefLang="ar" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {noindex ? (
        // `follow`, not `nofollow`. A noindexed page should still pass crawlers
        // through to the pages it links to — a search-results page links to real
        // articles, and `nofollow` would make it a dead end that swallows crawl
        // paths instead of forwarding them.
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content={site.locale} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${site.fullName} — ${site.title}`} />

      {/* Article-only signals. Google reads these for freshness. */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && modifiedAt && (
        <meta property="article:modified_time" content={modifiedAt} />
      )}
      {type === 'article' && <meta property="article:author" content={site.fullName} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={`${site.fullName} — ${site.title}`} />

      {/* No `geo.region` / `geo.placename`. Both encode a specific governorate,
          and this business is deliberately not pinned to one — it is a mobile
          service arranged by agreement, so any geo tag here would be a claim it
          does not want to make. */}

      {jsonLd && (
        <script
          type="application/ld+json"
          // Structured data must be a raw JSON string in the head; there is no
          // React-idiomatic alternative.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}

/**
 * `decodeURI` throws on a malformed sequence — a stray `%` in a URL somebody
 * hand-typed is enough. A crash in the <head> would take the whole page down, so
 * an undecodable path is used as-is.
 */
function safeDecode(value) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

/**
 * An absolute URL for the structured data, encoded identically to the canonical.
 *
 * This matters far more than it looks. With Arabic slugs, `${site.url}${path}`
 * yields `https://almaazoon.com/guides/المهر` — raw UTF-8 — while the canonical
 * tag emits the percent-encoded form. Those are, to a crawler reconciling a page's
 * identity, two different strings. The `@id` of the Article, the `url`, the
 * `mainEntityOfPage` and the canonical must all be *byte-identical*, or the page
 * is telling Google two stories about what it is.
 */
export function canonicalUrl(path) {
  return `${site.url}${path === '/' ? '' : encodeURI(safeDecode(path))}`;
}

/* ------------------------------------------------------------------ */
/* Schema graph                                                        */
/* ------------------------------------------------------------------ */

const PERSON_ID = `${site.url}/#person`;
const BUSINESS_ID = `${site.url}/#business`;
const WEBSITE_ID = `${site.url}/#website`;

/** The Ma'zoun himself. Referenced as the author of every fatwa. */
export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.fullName,
    jobTitle: site.title,
    description: site.credentials,
    image: `${site.url}/images/profile/almazon1.jpg`,
    url: site.url,
    telephone: site.phone.href.replace('tel:', ''),
    knowsAbout: [
      'توثيق عقود الزواج',
      'كتب الكتاب',
      'عقد القران',
      'الطلاق والرجعة',
      'زواج الأجانب',
      'قانون الأحوال الشخصية المصري',
    ],
    sameAs: site.social.map((s) => s.href),
    worksFor: { '@id': BUSINESS_ID },
  };
}

/**
 * The business, as a service-area LegalService.
 *
 * `LegalService` is a subtype of `LocalBusiness`, so this one node satisfies both
 * the Organization and the LocalBusiness requirement.
 *
 * Deliberately absent: `streetAddress`, `geo`, `openingHoursSpecification`, and
 * any governorate. He is متنقل and works by arrangement, so the only location
 * claim the structured data makes is the country. `areaServed` is stated at the
 * broadest honest level — a metro area, not an administrative region — because
 * naming a governorate here would pin the business to a place it does not want to
 * be pinned to, and Google cross-checks that claim against every other source.
 */
export function localBusinessSchema() {
  return {
    '@type': 'LegalService',
    '@id': BUSINESS_ID,
    name: `${site.name} — ${site.fullName}`,
    alternateName: 'مأذون شرعي متنقل',
    description: site.description,
    url: site.url,
    telephone: site.phone.href.replace('tel:', ''),
    image: `${site.url}/images/profile/banner-almazoon.png`,
    logo: `${site.url}/android-chrome-512x512.png`,
    priceRange: '$$',
    currenciesAccepted: 'EGP',
    founder: { '@id': PERSON_ID },
    address: {
      '@type': 'PostalAddress',
      addressCountry: site.address.country,
    },
    // The metro area only. No governorate, and none of the example areas — those
    // are illustrations on the page, not the business's declared location.
    areaServed: { '@type': 'AdministrativeArea', name: 'القاهرة الكبرى' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'خدمات المأذون الشرعي',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          description: service.description,
          provider: { '@id': BUSINESS_ID },
        },
      })),
    },
    sameAs: site.social.map((s) => s.href),
  };
}

/** The site itself, with the sitelinks search box. */
export function webSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url,
    name: site.name,
    inLanguage: 'ar-EG',
    publisher: { '@id': BUSINESS_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/articles?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Breadcrumbs. `trail` is [{ name, path }], root first. */
export function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

/** FAQPage — makes the FAQs eligible for rich results. */
export function faqSchema(faqs) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** A single fatwa. */
export function articleSchema(article, { wordCount, readingMinutes } = {}) {
  // The slugged URL, not `/articles/{_id}` — the `@id` and `mainEntityOfPage`
  // here must be the same URL the canonical tag points at, or Google is told the
  // page has two identities and picks one of them itself. Encoded through the
  // same helper the canonical uses, so the two strings are identical byte for byte.
  const url = canonicalUrl(articlePath(article));

  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: article.title.slice(0, 110), // Google truncates past ~110 chars.
    description: (article.content || '').trim().slice(0, 160),
    articleBody: article.content,
    articleSection: 'فتاوى الزواج والطلاق',
    inLanguage: 'ar-EG',
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    ...(wordCount ? { wordCount } : {}),
    ...(readingMinutes ? { timeRequired: `PT${readingMinutes}M` } : {}),
    ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
    author: { '@id': PERSON_ID },
    publisher: { '@id': BUSINESS_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

/**
 * A guide or service page from `src/content`.
 *
 * Guides are `Article`; services are `Service` offered by the business. The
 * distinction is not cosmetic — Google treats an `Article` as a thing to read and
 * a `Service` as a thing to buy, and it surfaces them in different places. Filing
 * a service page as an article forfeits the service treatment entirely.
 *
 * Both carry `author` and `publisher` pointing at the existing `@id` nodes, so
 * the Ma'zoun's Person entity accumulates every page on the site rather than each
 * page declaring an anonymous author.
 */
export function contentSchema(page, { path, wordCount, readingMinutes }) {
  const url = canonicalUrl(path);

  if (page.kind === 'service') {
    return {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: page.title,
      description: page.description,
      serviceType: page.title,
      url,
      inLanguage: 'ar-EG',
      provider: { '@id': BUSINESS_ID },
      areaServed: { '@type': 'AdministrativeArea', name: 'القاهرة الكبرى' },
      // The page *about* the service, so the prose is still attributable.
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
        name: page.seoTitle,
        inLanguage: 'ar-EG',
        datePublished: page.updated,
        dateModified: page.updated,
        author: { '@id': PERSON_ID },
        isPartOf: { '@id': WEBSITE_ID },
      },
    };
  }

  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: page.title.slice(0, 110),
    description: page.description,
    articleSection: page.silo,
    inLanguage: 'ar-EG',
    url,
    datePublished: page.updated,
    dateModified: page.updated,
    ...(wordCount ? { wordCount } : {}),
    ...(readingMinutes ? { timeRequired: `PT${readingMinutes}M` } : {}),
    author: { '@id': PERSON_ID },
    publisher: { '@id': BUSINESS_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

/**
 * A hub page listing other pages.
 *
 * `ItemList` is what tells Google the page is a *list of things* and what those
 * things are, rather than leaving it to infer the structure from the markup. It
 * is also what makes the hub's children discoverable from the hub alone.
 */
export function itemListSchema(items, { path, name }) {
  return {
    '@type': 'ItemList',
    '@id': `${site.url}${path}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: canonicalUrl(item.path),
    })),
  };
}

/**
 * The three entity nodes every page's graph must contain.
 *
 * This exists because of a bug that is invisible in the markup and fatal to the
 * thing it was written for.
 *
 * Article and Service nodes declare `author: {'@id': …#person}` and
 * `publisher: {'@id': …#business}`. An `@id` is a *reference*, and a reference
 * only resolves if the node it names is in the same `@graph`. Those nodes were
 * declared on the homepage and nowhere else — so on a guide, a service page, or a
 * fatwa, `author` pointed at an entity that did not exist in that document.
 * Google does not fetch the homepage to resolve it; it drops the property.
 *
 * The practical cost was the entire point of the exercise: pages of religious and
 * legal rulings were being published with *no resolvable author*, which is
 * precisely the E-E-A-T signal that matters most for this subject matter. Every
 * page carried a byline a reader could see and a crawler could not.
 *
 * Including the nodes on every page costs ~1.5KB of HTML and makes the Ma'zoun's
 * Person entity the declared author of every word on the site. The `@id`s are
 * stable, so Google merges the repeated declarations into one entity rather than
 * reading them as many.
 */
export function entityGraph() {
  return [localBusinessSchema(), personSchema(), webSiteSchema()];
}

/**
 * Wraps nodes into one `@graph`, so the entities cross-reference by `@id` instead
 * of every page re-declaring the business from scratch. One graph per page.
 *
 * Nested arrays are flattened, so `graph(...entityGraph(), articleSchema(a))` and
 * `graph(entityGraph(), articleSchema(a))` both do the right thing.
 */
export function graph(...nodes) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.flat().filter(Boolean),
  };
}
