import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * The first-visit welcome dialog.
 *
 * Opens on whichever comes first: eight seconds of reading, or 40% of the page
 * scrolled. Both are torn down as soon as either fires, so it can never open twice.
 *
 * Shown once per browser *session*. `sessionStorage`, not `localStorage`, is what
 * "per session" means — the flag dies with the tab, which is the promise being
 * made. (It holds a boolean, not a credential; the ban on storing tokens in web
 * storage is not in play here.) The flag is written the moment the dialog opens
 * rather than when it is dismissed, so a visitor who navigates away mid-dialog
 * still does not see it again.
 *
 * Accessibility is the whole cost of a modal, and it is paid in full here: the
 * dialog takes focus, traps Tab inside itself, closes on Escape or an outside
 * click, restores focus to wherever it came from, and freezes the page behind it.
 */

const SESSION_KEY = 'almaazoon:welcome-seen';
const DELAY_MS = 8000;
const SCROLL_TRIGGER = 0.4;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const bullets = [
  'معرفة الأوراق المطلوبة لإتمام عقد الزواج.',
  'قراءة الفتاوى الشرعية والقانونية.',
  'إرسال سؤالك مباشرة إلى المأذون.',
  'معرفة عنوان المكتب.',
  'التواصل بسهولة.',
];

const actions = [
  { emoji: '📄', label: 'الأوراق المطلوبة', href: '/#documents' },
  { emoji: '📍', label: 'عنوان المكتب', href: '/#location' },
  // A page, not a section — the ask form lives at /questions, and there is no
  // section on the homepage to scroll to. Linking to the page is the honest
  // destination; inventing a homepage form to have something to scroll to would
  // be inventing a feature.
  { emoji: '❓', label: 'اسأل المأذون', href: '/questions' },
  { emoji: '📞', label: 'تواصل معنا', href: '/#contact' },
];

export default function WelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  /* ---------------- trigger: 8s or 40%, whichever lands first ---------------- */

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // Private mode / storage disabled. Fail closed: never nag a visitor whose
      // browser cannot remember that they have already been shown this.
    }
    if (seen) return undefined;

    let timer;

    const show = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* Storage unavailable — the in-memory state still prevents a re-open. */
      }
      openerRef.current = document.activeElement;
      setOpen(true);
    };

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport can never be "40% scrolled"; the timer
      // is the only trigger that can fire there, which is correct.
      if (scrollable > 0 && window.scrollY / scrollable >= SCROLL_TRIGGER) show();
    }

    timer = window.setTimeout(show, DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Focus must not be left on a node that has just been removed, or it falls to
    // <body> and a keyboard user loses their place in the page.
    openerRef.current?.focus?.();
  }, []);

  /* ---------------- modal behaviour ---------------- */

  useEffect(() => {
    if (!open) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingInlineEnd;
    // Removing the scrollbar shifts the page under the overlay unless its width is
    // given back as padding.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingInlineEnd = `${scrollbar}px`;

    dialogRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingInlineEnd = previousPadding;
    };
  }, [open, close]);

  /**
   * Dismiss, then go.
   *
   * The dialog must be gone before the scroll starts — the page behind it is
   * scroll-locked while it is open, so scrolling first would simply do nothing.
   * If the section is on the current page it is scrolled to smoothly and the URL
   * is updated without a navigation; otherwise the link is followed.
   */
  const go = (event, href) => {
    close();

    const [path, hash] = href.split('#');
    const onThisPage = router.pathname === (path === '/' ? '/' : path.replace(/\/$/, ''));
    const target = hash && onThisPage ? document.getElementById(hash) : null;
    if (!target) return; // Let the <Link>/<a> navigate normally.

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${hash}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 backdrop-blur-[2px] animate-fade-up sm:items-center sm:p-6"
      // The backdrop closes the dialog. The check keeps a drag that *ends* out
      // here — a text selection released outside the card — from closing it.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        tabIndex={-1}
        // The card scrolls inside itself rather than letting the overlay scroll.
        // On a short phone the content is taller than the viewport, and an overlay
        // that scrolls would push the card flush to every edge — leaving no
        // backdrop to tap, which silently removes "click outside to close". Capping
        // the card at 85vh guarantees the backdrop is always reachable.
        className="relative max-h-[85svh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-ink-100 bg-surface p-6 shadow-lift outline-none sm:p-8"
      >
        <button
          type="button"
          onClick={close}
          // Not just "إغلاق": the button at the foot of the dialog is already
          // named that, and two controls with the same accessible name is a
          // screen-reader user being asked to guess.
          aria-label="إغلاق النافذة"
          className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ink-500 transition-colors duration-200 hover:bg-ink-50 hover:text-ink-900"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M4.75 6.75h14.5v10.5H4.75z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="m5.25 7.5 6.75 5 6.75-5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h2
          id="welcome-title"
          className="mt-5 text-2xl font-semibold tracking-tight text-ink-900"
        >
          مرحبًا بك
        </h2>

        <p className="mt-3 text-[0.9375rem] leading-[1.9] text-ink-600">يمكنك من خلال الموقع:</p>

        <ul className="mt-4 space-y-2.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <span
                className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                aria-hidden="true"
              />
              <span className="min-w-0 text-[0.9375rem] leading-[1.9] text-ink-600">{bullet}</span>
            </li>
          ))}
        </ul>

        {/* Two columns from the narrowest screen up. Stacked, these four rows add
            ~100px and push the card past the viewport on a short phone, which is
            what buries the backdrop and takes outside-click away. */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {actions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              onClick={(event) => go(event, action.href)}
              className="flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-ink-100 bg-paper px-3 py-2.5 text-sm font-medium text-ink-800 transition-colors duration-200 ease-premium hover:border-gold-200 hover:bg-gold-50 hover:text-gold-700 sm:gap-2.5 sm:px-4 sm:text-[0.9375rem]"
            >
              <span aria-hidden="true">{action.emoji}</span>
              <span className="min-w-0">{action.label}</span>
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-2.5 flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.9375rem] font-medium text-ink-500 transition-colors duration-200 ease-premium hover:bg-ink-50 hover:text-ink-900"
        >
          <span aria-hidden="true">✖</span>
          إغلاق
        </button>
      </div>
    </div>
  );
}
