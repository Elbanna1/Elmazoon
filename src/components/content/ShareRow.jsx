import { useState } from 'react';
import SocialIcon from '@/components/layout/SocialIcon';

/**
 * Share buttons.
 *
 * Every target is a plain link to the platform's own share URL — no SDK, no
 * third-party script, no tracking pixel. A share widget that ships 80KB of vendor
 * JS to render four icons is the single most common way an otherwise fast page
 * loses its Core Web Vitals.
 *
 * Lifted out of the article page so the guides and services use the identical
 * one. Two implementations of the same row is how they drift apart.
 */
export default function ShareRow({ title, url, label = 'شارك الصفحة', children }) {
  const text = `${title}\n${url}`;

  const targets = [
    { name: 'واتساب', icon: 'whatsapp', href: `https://wa.me/?text=${encodeURIComponent(text)}` },
    {
      name: 'فيسبوك',
      icon: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'تيليجرام',
      icon: 'telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
  ];

  return (
    <div className="mt-14 flex flex-col gap-4 border-t border-ink-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div>{children}</div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <ul className="flex gap-2">
          {targets.map((target) => (
            <li key={target.name}>
              <a
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`شارك عبر ${target.name}`}
                title={`شارك عبر ${target.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-100 bg-surface text-ink-500 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-900"
              >
                <SocialIcon name={target.icon} />
              </a>
            </li>
          ))}
          <li>
            <CopyLinkButton url={url} />
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Copy-to-clipboard, with the check mark as its own confirmation. */
function CopyLinkButton({ url }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard access is denied in insecure contexts. The share links
          // above still work, so there is nothing worth interrupting for.
        }
      }}
      aria-label={copied ? 'تم نسخ الرابط' : 'انسخ الرابط'}
      title={copied ? 'تم النسخ' : 'انسخ الرابط'}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-100 bg-surface text-ink-500 transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-900"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]" aria-hidden="true">
          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-[1.125rem] w-[1.125rem]" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
