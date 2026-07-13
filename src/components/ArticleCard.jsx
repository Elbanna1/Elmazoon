import Image from 'next/image';
import Link from 'next/link';
import { uploadUrl } from '@/lib/api';
import { articlePath } from '@/lib/slug';

/**
 * Fatwa card.
 *
 * Three bugs from the old `Project` component are gone:
 *  - it rendered a <Head> inside a .map(), so every card fought over the page
 *    <title> and the last one won;
 *  - it fired a GET /uploads/:file per card just to read the redirect URL back
 *    off the response — 30 extra requests to render one page;
 *  - the image linked to `href={link}` (a bare Mongo id), producing a relative
 *    URL that 404'd, and both links opened internal pages in a new tab.
 */
export default function ArticleCard({
  id,
  title,
  content,
  image,
  priority = false,
  /**
   * The card's title is a real heading, so its level depends on where the card
   * sits. On the articles list it follows the page `h1`, so it is an `h2`; under
   * "فتاوى ذات صلة" — itself an `h2` — it must be an `h3`, or the outline skips.
   */
  headingLevel: Heading = 'h2',
}) {
  const src = uploadUrl(image);
  const excerpt = (content || '').trim();

  // The canonical slugged URL, derived from the same helper the page itself uses.
  // A card linking to `/articles/{id}` would land every visitor on a redirect.
  const href = articlePath({ _id: id, title });

  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-subtle transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
      <Link href={href} className="block h-full focus-visible:outline-none">
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
          {src ? (
            <Image
              src={src}
              alt={title || 'صورة الفتوى'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
                <path d="m5 17 4.5-4.5L13 16l3-2.5L19 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-5">
          <Heading className="ugc line-clamp-2 text-[1.0625rem] font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-gold-700">
            {title}
          </Heading>
          {/* The old excerpt was `content.substring(0, 20)` — twenty characters,
              with an ellipsis appended even when nothing was truncated. */}
          <p className="ugc mt-2.5 line-clamp-3 text-sm leading-[1.9] text-ink-500">{excerpt}</p>

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600">
            اقرأ الفتوى
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:-translate-x-1"
              aria-hidden="true"
            >
              <path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}
