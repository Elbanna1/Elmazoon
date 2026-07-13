import { useEffect, useState } from 'react';

/**
 * Table of contents.
 *
 * Two jobs, and the SEO one is the less obvious of the two:
 *
 *  1. **For the reader**, on a long legal page, it is the difference between
 *     scanning and scrolling.
 *  2. **For Google**, a set of same-page `#anchor` links to real headings is what
 *     makes a page eligible for *jump-to* sitelinks — the sub-links that appear
 *     indented beneath a result and let someone land directly on «متى يبطل العقد».
 *     Those cannot be requested; they are earned by having anchored headings that
 *     a crawler can see in the HTML. This renders as real `<a href="#…">` in the
 *     server output for exactly that reason — never as a JS-driven scroll handler.
 *
 * The active-section highlight is progressive enhancement layered on top. If the
 * JS never runs, this is still a working list of links.
 */
export default function TableOfContents({ sections = [] }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (sections.length === 0) return undefined;

    // `rootMargin` pulls the detection line up to ~1/3 from the top of the
    // viewport. Without it the "active" heading is whichever is nearest the
    // bottom edge, which lags a section behind where the reader actually is.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-labelledby="toc-heading"
      className="my-10 rounded-2xl border border-ink-100 bg-surface p-5 shadow-subtle sm:p-6"
    >
      <h2 id="toc-heading" className="text-sm font-semibold text-ink-900">
        محتويات الصفحة
      </h2>

      {/* An ordered list: the sections have a sequence, and a screen reader
          announcing "1 of 5" is telling the user something true. */}
      <ol className="mt-4 space-y-2.5">
        {sections.map((section, i) => {
          const isActive = active === section.id;

          return (
            <li key={section.id} className="flex gap-2.5">
              <span
                className="mt-px shrink-0 text-xs font-semibold text-ink-300 ltr-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <a
                href={`#${section.id}`}
                // `aria-current` is the accessible half of the visual highlight.
                aria-current={isActive ? 'true' : undefined}
                // `min-h-6` = 24px, the WCAG 2.2 minimum target size. These are a
                // list of navigation links, not links inside a sentence, so the
                // spec's inline exception does not cover them — at the default
                // line height they were 21px tall on a phone.
                className={`inline-flex min-h-6 items-center text-[0.9375rem] leading-snug underline-offset-4 transition-colors duration-200 hover:text-gold-700 hover:underline ${
                  isActive ? 'font-medium text-gold-700' : 'text-ink-600'
                }`}
              >
                {section.heading}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
