/**
 * A blank grid is indistinguishable from a failed fetch. This makes the
 * difference explicit — the old pages rendered nothing in both cases.
 */
export default function EmptyState({ title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-surface/60 px-6 py-14 text-center ${className}`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-ink-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-base font-semibold text-ink-800">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
