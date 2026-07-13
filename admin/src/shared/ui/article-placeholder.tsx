/**
 * What a fatwa with no cover image looks like.
 *
 * The image is optional everywhere, so "no image" is a state the design has to
 * have an answer for — not a hole to be papered over with a grey box. This keeps
 * the card's aspect ratio, so a mixed grid of illustrated and plain fatwas still
 * lines up, and it borrows the site's own gold wash so it reads as part of the
 * brand rather than as a missing asset.
 */
export function ArticlePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[radial-gradient(80%_80%_at_50%_0%,#faf5eb,#f4f2ee)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" className="size-12 text-gold-300">
        {/* A page with a fold — an article, not a broken picture. */}
        <path
          d="M13 6h14l8 8v28a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M27 6v8h8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path
          d="M17 24h14M17 30h14M17 36h8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
