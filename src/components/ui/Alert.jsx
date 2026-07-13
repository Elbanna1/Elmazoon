/**
 * Success and error are separate, visually distinct states.
 *
 * The old code funnelled both through a single `error` variable rendered in the
 * same colour — so "تم اضافة سؤالك بنجاح" and "حصلت مشكلة" looked identical.
 */

const tones = {
  success: {
    wrap: 'border-success/20 bg-success/5 text-success',
    icon: (
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  error: {
    wrap: 'border-danger/20 bg-danger/5 text-danger',
    icon: (
      <>
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
  info: {
    wrap: 'border-ink-100 bg-ink-50 text-ink-700',
    icon: (
      <>
        <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
};

export default function Alert({ tone = 'info', children, className = '' }) {
  if (!children) return null;
  const t = tones[tone] ?? tones.info;

  return (
    <div
      // Errors interrupt; successes wait their turn.
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium animate-fade-up ${t.wrap} ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="mt-px h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true">
        {t.icon}
      </svg>
      <span>{children}</span>
    </div>
  );
}
