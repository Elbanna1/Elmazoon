import SocialIcon from '@/components/layout/SocialIcon';
import { contactChannels } from '@/lib/site';

/**
 * The contact surface. One tap per channel, no intermediate page.
 *
 * The site previously "advertised" WhatsApp in prose and banners and then made
 * you hunt for the actual link. A channel is not something to market — it is
 * something to open, so each card *is* the link.
 *
 * Brand colour is deliberate: a green tile reads as WhatsApp before a single
 * word is parsed. That instant recognition is the whole point, and it is why
 * these are the only saturated colours allowed anywhere in the design system.
 */

const tones = {
  phone: {
    // Phone has no brand colour, so it takes the product's own — ink and gold.
    tile: 'bg-ink-900 text-gold-300',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(11,11,12,0.45)]',
    ring: 'group-hover:border-ink-300',
  },
  whatsapp: {
    tile: 'bg-brand-whatsapp text-white',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(37,211,102,0.65)]',
    ring: 'group-hover:border-brand-whatsapp/40',
  },
  facebook: {
    tile: 'bg-brand-facebook text-white',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(24,119,242,0.6)]',
    ring: 'group-hover:border-brand-facebook/40',
  },
  instagram: {
    // Instagram is a gradient, not a colour — anything else looks counterfeit.
    tile:
      'bg-gradient-to-tr from-brand-instagram-from via-brand-instagram-via to-brand-instagram-to text-white',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(221,42,123,0.6)]',
    ring: 'group-hover:border-brand-instagram-via/40',
  },
  youtube: {
    tile: 'bg-brand-youtube text-white',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(255,0,0,0.55)]',
    ring: 'group-hover:border-brand-youtube/40',
  },
  tiktok: {
    tile: 'bg-brand-tiktok text-white',
    glow: 'group-hover:shadow-[0_16px_40px_-16px_rgba(1,1,1,0.45)]',
    ring: 'group-hover:border-ink-300',
  },
};

export default function ContactChannels({ channels = contactChannels, className = '' }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {channels.map((channel) => {
        const tone = tones[channel.tone] ?? tones.phone;
        // `tel:` must stay in the same tab — a new tab would open, hand off to
        // the dialer, and leave a blank orphan tab behind on mobile.
        const newTab = !channel.sameTab;

        return (
          <li key={channel.name}>
            <a
              href={channel.href}
              {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`group flex h-full items-center gap-4 rounded-2xl border border-ink-100 bg-surface p-4 shadow-subtle transition-[transform,box-shadow,border-color] duration-300 ease-premium hover:-translate-y-1 hover:shadow-card sm:p-5 ${tone.ring}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-subtle transition-[transform,box-shadow] duration-300 ease-premium group-hover:scale-105 ${tone.tile} ${tone.glow}`}
              >
                <SocialIcon name={channel.icon} className="h-6 w-6" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold text-ink-900">
                  {channel.name}
                </span>
                <span className="ltr-nums mt-0.5 block truncate text-sm text-ink-400">
                  {channel.action}
                </span>
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 shrink-0 text-ink-300 transition-[transform,color] duration-300 ease-premium group-hover:-translate-x-1 group-hover:text-ink-600"
                aria-hidden="true"
              >
                <path
                  d="M19 12H5m0 0 6-6m-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Compact icon-only row (footer, and anywhere a full card grid is too heavy).
 * Rests neutral so it does not shout, then floods with the platform's own colour
 * on hover.
 *
 * Every class is written out in full: Tailwind extracts class names by scanning
 * the source as plain text, so a class assembled at runtime is never generated.
 */
const hoverTones = {
  whatsapp: 'hover:bg-brand-whatsapp hover:shadow-[0_10px_28px_-10px_rgba(37,211,102,0.7)]',
  facebook: 'hover:bg-brand-facebook hover:shadow-[0_10px_28px_-10px_rgba(24,119,242,0.65)]',
  instagram:
    'hover:bg-gradient-to-tr hover:from-brand-instagram-from hover:via-brand-instagram-via hover:to-brand-instagram-to hover:shadow-[0_10px_28px_-10px_rgba(221,42,123,0.65)]',
  youtube: 'hover:bg-brand-youtube hover:shadow-[0_10px_28px_-10px_rgba(255,0,0,0.6)]',
  tiktok: 'hover:bg-brand-tiktok hover:shadow-[0_10px_28px_-10px_rgba(1,1,1,0.5)]',
  phone: 'hover:bg-ink-900 hover:shadow-[0_10px_28px_-10px_rgba(11,11,12,0.5)]',
};

export function SocialLinks({ items, className = '' }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            // Without this a screen reader announces only "link".
            aria-label={item.name}
            title={item.name}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border border-ink-100 bg-surface text-ink-400 transition-[transform,box-shadow,border-color,background-color,color] duration-300 ease-premium hover:-translate-y-0.5 hover:border-transparent hover:text-white ${
              hoverTones[item.icon] ?? hoverTones.phone
            }`}
          >
            <SocialIcon name={item.icon} className="h-5 w-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
