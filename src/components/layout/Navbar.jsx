import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { navLinks, sectionLinks, site } from '@/lib/site';
import Button from '@/components/ui/Button';
import SocialIcon from './SocialIcon';

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const visibleRef = useRef(new Set());

  const onHome = router.pathname === '/';

  // The bar starts transparent over the hero and gains a hairline + blur on
  // scroll. Cheap, and it's the single detail that makes a header feel modern.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on navigation, otherwise it stays open over the new page.
  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events]);

  // Escape to close + scroll lock + return focus to the trigger. The old menu
  // had none of this.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  /**
   * Scroll-spy for the two section links.
   *
   * An IntersectionObserver rather than a scroll listener: a listener would run on
   * every frame of every scroll on every page, and this only needs to fire when a
   * section actually crosses a boundary.
   *
   * The observation band is the strip between the bottom of the sticky header
   * (96px) and 45% of the viewport — `rootMargin` shrinks the root to that strip.
   * Without it a tall section counts as "visible" the moment one pixel of it
   * appears at the very bottom of the screen, and both links would light up at
   * once. A Set is kept because two sections can overlap the band during a fast
   * scroll; the earlier one in document order wins, which is the one the reader is
   * actually looking at.
   */
  useEffect(() => {
    visibleRef.current = new Set();
    setActiveSection(null);
    if (!onHome) return undefined;

    const elements = sectionLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleRef.current.add(entry.target.id);
          else visibleRef.current.delete(entry.target.id);
        }
        const first = sectionLinks.find((link) => visibleRef.current.has(link.id));
        setActiveSection(first?.id ?? null);
      },
      { rootMargin: '-96px 0px -45% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onHome]);

  /**
   * Scroll to a section, or navigate home first if we are not there.
   *
   * The scroll is deferred to the frame *after* the drawer has closed, and that is
   * not a nicety. The open drawer is part of the header, so it adds ~430px to the
   * document above the fold; measuring the target while it is open and then letting
   * it collapse mid-flight lands the reader 426px past the section. Waiting for the
   * next paint means the position is measured against the layout the reader will
   * actually be looking at.
   *
   * `requestAnimationFrame` twice: the first fires before React has committed the
   * closed drawer, the second after the browser has laid it out.
   */
  const goToSection = (event, link) => {
    setOpen(false);
    if (!onHome) return; // Not on the homepage — let the <Link> navigate to /#id.

    event.preventDefault();

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = document.getElementById(link.id);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', link.href);
      })
    );
  };

  const isActive = (href) => {
    // While a section is under the header it owns the active state — otherwise the
    // homepage link and the section link would both be lit at the same time.
    if (href === '/') return onHome && !activeSection;
    return router.pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ease-premium ${
        scrolled
          ? 'border-b border-ink-100 bg-paper/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        aria-label="التنقل الرئيسي"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-6 lg:px-8"
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="group flex min-h-[2.75rem] items-center gap-2.5 rounded-md"
          aria-label={`${site.name} — الصفحة الرئيسية`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-gold-300 transition-colors duration-300 group-hover:bg-gold-600 group-hover:text-white">
            م
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.9375rem] font-semibold text-ink-900">{site.name}</span>
            <span className="mt-1 text-[0.6875rem] font-medium text-ink-500">{site.fullName}</span>
          </span>
        </Link>

        {/* Desktop links */}
        {/* Seven links. At 1024 they fit with 8px to spare, which is not a margin
            — a slightly wider Arabic fallback font and they wrap or push the
            actions off the bar. The horizontal padding tightens at `lg` and is
            restored at `xl`, which buys ~80px and costs nothing visible. */}
        <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                // `inline-flex`, not the default `inline`. On an inline element
                // vertical padding paints but does not grow the layout box, so
                // `py-2` left these links with a 20px box — under the 24px WCAG
                // 2.2 minimum target size, and ambiguous to hit-test. As a flex
                // box the padding is real and the target is the 36px it looks.
                className={`relative inline-flex min-h-6 items-center whitespace-nowrap rounded-md px-2.5 py-2 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-3.5 ${
                  isActive(link.href)
                    ? 'text-ink-900'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-2.5 -bottom-0.5 h-px origin-center bg-gold-500 transition-transform duration-300 ease-premium xl:inset-x-3.5 ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}

          {sectionLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={(event) => goToSection(event, link)}
                aria-current={activeSection === link.id ? 'location' : undefined}
                className={`relative inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-3 ${
                  activeSection === link.id ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <span aria-hidden="true" className="text-[0.8125rem] leading-none">
                  {link.emoji}
                </span>
                {link.label}
                <span
                  className={`absolute inset-x-2.5 -bottom-0.5 h-px origin-center bg-gold-500 transition-transform duration-300 ease-premium xl:inset-x-3 ${
                    activeSection === link.id ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 transition-colors duration-200 hover:bg-ink-50 hover:text-ink-900"
            aria-label="تواصل عبر واتساب"
          >
            <SocialIcon name="whatsapp" className="h-[1.375rem] w-[1.375rem]" />
          </a>
          <Button href={site.phone.href} variant="ink" size="sm">
            اتصل الآن
          </Button>
        </div>

        {/* Mobile trigger — 44px target, real accessible name, aria-expanded */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-800 transition-colors duration-200 hover:bg-ink-50 lg:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-premium ${
                open ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute inset-x-0 top-[7px] h-[1.5px] rounded-full bg-current transition-opacity duration-200 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute inset-x-0 top-[14px] h-[1.5px] rounded-full bg-current transition-transform duration-300 ease-premium ${
                open ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile drawer — slides from the top, under the bar, not a centered
          floating box that covers the header it was launched from. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="border-t border-ink-100 bg-paper/95 backdrop-blur-xl lg:hidden"
      >
        <div className="space-y-1 px-5 py-4 sm:px-6">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`flex animate-fade-up items-center justify-between rounded-lg px-3.5 py-3 text-base font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? 'bg-ink-50 text-ink-900'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`}
            >
              {link.label}
              {isActive(link.href) && <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />}
            </Link>
          ))}

          {sectionLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(event) => goToSection(event, link)}
              aria-current={activeSection === link.id ? 'location' : undefined}
              style={{ animationDelay: `${(navLinks.length + i) * 40}ms` }}
              className={`flex animate-fade-up items-center justify-between rounded-lg px-3.5 py-3 text-base font-medium transition-colors duration-200 ${
                activeSection === link.id
                  ? 'bg-ink-50 text-ink-900'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="text-sm leading-none">
                  {link.emoji}
                </span>
                {link.label}
              </span>
              {activeSection === link.id && (
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              )}
            </Link>
          ))}

          <div className="!mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4">
            <Button href={site.phone.href} variant="ink" size="md" className="w-full">
              اتصل الآن — <span className="ltr-nums">{site.phone.display}</span>
            </Button>
            <Button href={site.whatsapp.href} variant="secondary" size="md" className="w-full">
              <SocialIcon name="whatsapp" />
              واتساب
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
