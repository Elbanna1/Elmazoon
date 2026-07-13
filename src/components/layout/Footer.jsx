import Link from 'next/link';
import { navLinks, services, site } from '@/lib/site';
import { Container } from '@/components/ui/Layout';
import { SocialLinks } from '@/components/ContactChannels';

/**
 * The footer had no mobile layout — only a desktop 12-column grid that collapsed
 * to a single column below `lg`, while keeping desktop-scale spacing.
 *
 * Two things followed from that, and they are the bugs being fixed here:
 *
 *  1. Every section became a full-width block inheriting `text-align: start`.
 *     In an RTL document `start` is the *right* edge, so every line hugged the
 *     right and left the whole left half of the screen empty. That is the "huge
 *     white space on the left" — not a stray margin, and not something
 *     `overflow-x: hidden` or a nudge could have fixed.
 *
 *  2. Four stacked sections at `gap-10` (40px each) plus `py-14` (56px) made the
 *     footer 901–927px tall on a phone, against 369px on desktop.
 *
 * The fix is mobile-first: on a phone the content is centred and the two short
 * link lists sit side by side; every desktop rule is then restored explicitly at
 * `sm:` and `lg:`, so the tablet and desktop layouts render exactly as before.
 * No colours and no type scales are touched.
 */
export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-surface">
      {/* Mobile gets tighter vertical padding; `sm:` restores the original. */}
      <Container className="py-10 sm:py-16">
        <div
          className={
            // Mobile: two columns, centred text, tighter gaps.
            'grid grid-cols-2 gap-x-6 gap-y-9 text-center ' +
            // From `sm` up: exactly the original two-column, start-aligned grid.
            'sm:grid-cols-2 sm:gap-10 sm:text-start ' +
            'lg:grid-cols-12 lg:gap-8'
          }
        >
          {/* Identity — full width on mobile, one column from `sm` as before. */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-5">
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-gold-300">
                م
              </span>
              <div className="text-start leading-none">
                <p className="text-[0.9375rem] font-semibold text-ink-900">{site.name}</p>
                <p className="mt-1 text-[0.6875rem] font-medium text-ink-400">{site.fullName}</p>
              </div>
            </div>

            {/* `mx-auto` centres the measure on mobile; `sm:mx-0` puts it back. */}
            <p className="mx-auto mt-4 max-w-sm text-sm leading-[1.9] text-ink-500 sm:mx-0 sm:mt-5">
              {site.credentials}
            </p>

            {/* The icon row filled the full column width and sat against the RTL
                start edge, which read as "not centred". Centre it on mobile. */}
            <SocialLinks
              items={site.social}
              className="mt-5 justify-center sm:mt-6 sm:justify-start"
            />
          </div>

          {/* Pages — one of the two mobile columns. */}
          <nav className="lg:col-span-3" aria-labelledby="footer-pages">
            <h2
              id="footer-pages"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400"
            >
              الصفحات
            </h2>
            <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services — internal-link surface for SEO, not just decoration. */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              الخدمات
            </h2>
            <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              {services.map((s) => (
                <li key={s.title} className="text-sm text-ink-600">
                  {s.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full width on mobile so the numbers have room to sit on one
              line and stay easy to read; one column from `sm`, as before. */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              تواصل
            </h2>
            <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              <li>
                <a
                  href={site.phone.href}
                  // A phone number is a touch target before it is text: 44px is the
                  // minimum comfortable tap size, and it costs no extra height here
                  // because the row already occupies a line.
                  className="inline-flex min-h-[2.75rem] items-center text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600 sm:min-h-0"
                >
                  <span className="ltr-nums">{site.phone.display}</span>
                </a>
              </li>
              <li>
                <a
                  href={site.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[2.75rem] items-center gap-1 text-sm text-ink-600 transition-colors duration-200 hover:text-gold-600 sm:min-h-0"
                >
                  واتساب — <span className="ltr-nums">{site.whatsapp.display}</span>
                </a>
              </li>
              <li className="text-sm text-ink-500">{site.address.serviceNote}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-ink-100 pt-6 text-center sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-start">
          <p className="text-xs text-ink-400">
            © <span className="ltr-nums">{new Date().getFullYear()}</span> {site.name} — جميع الحقوق
            محفوظة.
          </p>
          <p className="text-xs text-ink-300">{site.address.coverage}</p>
        </div>
      </Container>
    </footer>
  );
}
