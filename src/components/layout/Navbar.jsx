import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { navLinks, site } from '@/lib/site';
import Button from '@/components/ui/Button';
import SocialIcon from './SocialIcon';

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

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

  const isActive = (href) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

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
          className="group flex items-center gap-2.5 rounded-md"
          aria-label={`${site.name} — الصفحة الرئيسية`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-gold-300 transition-colors duration-300 group-hover:bg-gold-600 group-hover:text-white">
            م
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[0.9375rem] font-semibold text-ink-900">{site.name}</span>
            <span className="mt-1 text-[0.6875rem] font-medium text-ink-400">{site.fullName}</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative rounded-md px-3.5 py-2 text-[0.9375rem] font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-ink-900'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-center bg-gold-500 transition-transform duration-300 ease-premium ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0'
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
