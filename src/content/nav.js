/**
 * The service links for the sitewide footer — titles and slugs, and nothing else.
 *
 * This list is deliberately a *copy* rather than a derivation, and the reason is
 * bundle size, measured rather than assumed.
 *
 * The footer renders inside `_app`, so whatever it imports is in the shared chunk
 * of every single page. Importing `@/content` there pulled the whole content layer
 * — the full Arabic prose of all 23 guides and services, plus the search index
 * built over them — into the bundle for the homepage, the 404, and every other
 * page that never renders a word of it. It cost ~9KB on first load, sitewide, to
 * render five link labels. Tree-shaking cannot help: the prose lives inside the
 * same object literals as the titles.
 *
 * The duplication this creates is real, so it is *checked* rather than trusted:
 * `contentIssues()` fails the audit if this list and `services.js` ever disagree
 * on a slug or a title. Drift is caught in the build that introduces it.
 */
export const serviceNav = [
  { slug: 'كتب-الكتاب-وعقد-القران', title: 'كتب الكتاب وعقد القران' },
  { slug: 'توثيق-عقد-الزواج', title: 'توثيق عقد الزواج' },
  { slug: 'توثيق-الطلاق-والرجعة', title: 'توثيق الطلاق والرجعة' },
  { slug: 'زواج-الاجانب-في-مصر', title: 'زواج الأجانب في مصر' },
  { slug: 'التصادق-واثبات-الزواج', title: 'التصادق وإثبات الزواج' },
];
