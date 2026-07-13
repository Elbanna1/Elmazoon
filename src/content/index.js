/**
 * The content layer's public surface.
 *
 * Guides and services are the same shape and differ only in intent, so they are
 * indexed together and told apart by `kind`. Everything the pages need — lookup,
 * the internal link graph, the search index, reading time — is derived from the
 * two source arrays rather than maintained alongside them. A hand-maintained
 * "related articles" list is a list that goes stale on the first rename; a derived
 * one cannot.
 */

import { guides } from './guides';
import { services } from './services';
import { serviceNav } from './nav';
import { siloList, silos } from './silos';
import { indexDocument } from '@/lib/search';

export { silos, siloList };

/** Every page, both kinds. */
export const pages = [...services, ...guides];

const BY_SLUG = new Map(pages.map((page) => [page.slug, page]));

export function pageBySlug(slug) {
  return BY_SLUG.get(decodeURIComponent(String(slug ?? ''))) ?? null;
}

export function pagesOfKind(kind) {
  return pages.filter((page) => page.kind === kind);
}

export function pagesInSilo(siloId) {
  return pages.filter((page) => page.silo === siloId);
}

/** The URL for a content page. Services and guides live under separate roots so
 *  that the two intents are separable in Search Console and in the sitemap. */
export function pagePath(page) {
  return `/${page.kind === 'service' ? 'services' : 'guides'}/${page.slug}`;
}

/**
 * Resolve `related` slugs into real pages.
 *
 * A slug that no longer exists is dropped rather than rendered as a dead link —
 * an internal 404 is a crawl-budget leak and it is the one kind of broken link a
 * site has no excuse for. Anything unresolvable shows up in `contentIssues()`.
 */
export function relatedPages(page, { limit = 4 } = {}) {
  const seen = new Set([page.slug]);
  const out = [];

  for (const slug of page.related ?? []) {
    const target = BY_SLUG.get(slug);
    if (target && !seen.has(slug)) {
      seen.add(slug);
      out.push(target);
    }
  }

  // Backfill from the same silo, so a page with thin `related` is never a
  // dead end. Every page must offer the reader somewhere to go next.
  if (out.length < limit) {
    for (const sibling of pagesInSilo(page.silo)) {
      if (out.length >= limit) break;
      if (!seen.has(sibling.slug)) {
        seen.add(sibling.slug);
        out.push(sibling);
      }
    }
  }

  return out.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Derived metrics                                                     */
/* ------------------------------------------------------------------ */

/** Every word of prose on a page, for word count and reading time. */
export function pageText(page) {
  const parts = [page.lede];

  for (const section of page.sections ?? []) {
    parts.push(section.heading, ...(section.body ?? []), ...(section.list ?? []), section.note);
  }

  for (const faq of page.faqs ?? []) {
    parts.push(faq.question, faq.answer);
  }

  return parts.filter(Boolean).join(' ');
}

export function wordCount(page) {
  return pageText(page).trim().split(/\s+/).filter(Boolean).length;
}

/** 180 wpm — Arabic is written without short vowels, so it reads slower than the
 *  200–250 wpm figure everyone copies from English blogs. Never below 1. */
export function readingMinutes(page) {
  return Math.max(1, Math.round(wordCount(page) / 180));
}

/* ------------------------------------------------------------------ */
/* Search index                                                        */
/* ------------------------------------------------------------------ */

/**
 * The static half of the search index — every guide and service.
 *
 * Built once at module load. The fatwa half is merged in at query time, because
 * those come from the API and change without a deploy.
 */
export const contentIndex = pages.map((page) =>
  indexDocument({
    id: page.slug,
    href: pagePath(page),
    title: page.title,
    body: pageText(page),
    keywords: page.keywords ?? [],
    kind: page.kind,
    silo: page.silo,
  }),
);

/* ------------------------------------------------------------------ */
/* Integrity                                                           */
/* ------------------------------------------------------------------ */

/**
 * Everything wrong with the content, as data.
 *
 * Run by `scripts/content-audit.mjs` in CI. These are the failures that are
 * invisible until Search Console reports them weeks later: a `related` pointing
 * at a slug that was renamed, a title too long to survive the SERP, a description
 * that Google will truncate mid-word, a page filed under a silo that does not
 * exist.
 */
export function contentIssues() {
  const issues = [];

  /**
   * The footer's copy of the service list must match the real one.
   *
   * `content/nav.js` duplicates the service slugs and titles on purpose, to keep
   * the content layer out of the shared bundle. Duplication that nothing checks is
   * duplication that goes stale, so this is the check: rename a service or add one
   * and forget the footer, and the build says so.
   */
  const realServices = pagesOfKind('service');

  if (serviceNav.length !== realServices.length) {
    issues.push({
      at: 'content/nav.js',
      level: 'error',
      message: `قائمة التذييل بها ${serviceNav.length} خدمة والفعلي ${realServices.length}`,
    });
  }

  for (const entry of serviceNav) {
    const real = BY_SLUG.get(entry.slug);
    if (!real) {
      issues.push({
        at: 'content/nav.js',
        level: 'error',
        message: `قائمة التذييل تشير إلى خدمة غير موجودة: ${entry.slug}`,
      });
    } else if (real.title !== entry.title) {
      issues.push({
        at: 'content/nav.js',
        level: 'error',
        message: `عنوان مختلف في التذييل: «${entry.title}» بدل «${real.title}»`,
      });
    }
  }

  for (const page of pages) {
    const at = `${page.kind}/${page.slug}`;

    if (!silos[page.silo]) {
      issues.push({ at, level: 'error', message: `silo غير معروف: ${page.silo}` });
    }

    for (const slug of page.related ?? []) {
      if (!BY_SLUG.has(slug)) {
        issues.push({ at, level: 'error', message: `related يشير إلى صفحة غير موجودة: ${slug}` });
      }
    }

    // Google renders roughly 580px of title; ~60 Arabic characters is the safe
    // ceiling. Past that it truncates, and the truncation lands on the part the
    // page was written to rank for.
    const titleLength = `${page.seoTitle} | المأذون الشرعي`.length;
    if (titleLength > 62) {
      issues.push({ at, level: 'warn', message: `عنوان SEO طويل (${titleLength} حرفًا)` });
    }

    if (page.description.length > 160) {
      issues.push({
        at,
        level: 'warn',
        message: `الوصف طويل (${page.description.length} حرفًا)`,
      });
    }
    if (page.description.length < 70) {
      issues.push({
        at,
        level: 'warn',
        message: `الوصف قصير (${page.description.length} حرفًا)`,
      });
    }

    if (!page.faqs?.length) {
      issues.push({ at, level: 'warn', message: 'لا توجد أسئلة شائعة — تفقد الصفحة أهليتها للنتائج الثرية' });
    }

    if (wordCount(page) < 250) {
      issues.push({ at, level: 'warn', message: `محتوى قليل (${wordCount(page)} كلمة)` });
    }

    // Orphan check: a page nothing links to is a page Google will struggle to
    // find and will rank as though nobody vouches for it.
    const inbound = pages.filter((other) => other.related?.includes(page.slug)).length;
    if (inbound === 0) {
      issues.push({ at, level: 'warn', message: 'صفحة يتيمة — لا توجد صفحة أخرى تشير إليها' });
    }
  }

  return issues;
}

/** Pages carrying claims the Ma'zoun has not signed off on yet. */
export function pendingReview() {
  return pages
    .filter((page) => page.review?.length)
    .map((page) => ({ at: `${page.kind}/${page.slug}`, title: page.title, notes: page.review }));
}
