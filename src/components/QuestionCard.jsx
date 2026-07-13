/**
 * A published question and, if it exists, the Ma'zoun's answer.
 *
 * `createdAt` used to arrive pre-formatted as `dd/mm/yyyy` from the old Node
 * backend, so it was rendered as-is. The current backend returns a raw ISO
 * timestamp, and rendering *that* as-is put `2026-07-13T11:24:58.4342589` on the
 * page in front of visitors. It is formatted here now.
 */

/** The date, or nothing. Never a raw timestamp. */
function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function QuestionCard({
  question,
  commenter,
  commentedAt,
  response,
  highlight,
  // Marks a card in the "أسئلتي" list — the asker's own question.
  mine = false,
  // Backend-provided: this answer has not been seen by its asker yet.
  isNew = false,
}) {
  const initial = (commenter || '؟').trim().charAt(0);
  const answered = Boolean(response);
  const asked = formatDate(commentedAt);

  return (
    <article
      className={`rounded-2xl border bg-surface p-5 shadow-subtle transition-shadow duration-300 ease-premium hover:shadow-card sm:p-6 ${
        mine ? 'border-gold-200 ring-1 ring-gold-100' : 'border-ink-100'
      }`}
    >
      <header className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500"
          aria-hidden="true"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">
            {commenter}
            {mine && <span className="ms-2 text-xs font-normal text-gold-700">(سؤالك)</span>}
          </p>
          {asked && (
            <p className="mt-0.5 text-xs text-ink-400">
              <time dateTime={commentedAt} className="ltr-nums">
                {asked}
              </time>
            </p>
          )}
        </div>

        {/* The status is stated explicitly, not merely implied by whether an
            answer happens to be rendered below. */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isNew && answered && (
            <span className="rounded-md bg-gold-500 px-2 py-1 text-xs font-medium text-white">
              رد جديد
            </span>
          )}
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              answered ? 'bg-success/10 text-success' : 'bg-gold-50 text-gold-700'
            }`}
          >
            {answered ? 'تم الرد' : 'بانتظار الرد'}
          </span>
        </div>
      </header>

      <p className="ugc mt-4 whitespace-pre-line text-[0.9375rem] leading-[1.95] text-ink-800">
        <Highlight text={question} query={highlight} />
      </p>

      {response ? (
        <div className="mt-5 rounded-xl border-e-2 border-gold-400 bg-gold-50/50 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700">
            رد المأذون
          </p>
          <p className="ugc whitespace-pre-line text-[0.9375rem] leading-[1.95] text-ink-700">
            <Highlight text={response} query={highlight} />
          </p>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-ink-50 px-4 py-3">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-500" />
          </span>
          {/* The old copy read "سيتم الرد عليك" — "you" — on every card in a
              public list, addressing the reader rather than the asker. */}
          <p className="text-sm text-ink-400">في انتظار رد المأذون</p>
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Each Arabic letter that has orthographic variants expands to a character
 * class, so the highlight lands on the same text the search matched.
 *
 * Searching `اسلام` must highlight `الإسلام` — matching the raw string would
 * highlight nothing, and the user would be looking at a result list with no
 * visible reason for any of it being there.
 */
const VARIANTS = {
  ا: '[اأإآٱ]',
  أ: '[اأإآٱ]',
  إ: '[اأإآٱ]',
  آ: '[اأإآٱ]',
  ي: '[يىئ]',
  ى: '[يىئ]',
  ئ: '[يىئ]',
  و: '[وؤ]',
  ؤ: '[وؤ]',
  ه: '[هة]',
  ة: '[هة]',
};

// Diacritics and tatweel may sit between any two letters of the match.
const JOINER = '[ً-ْـ]*';

function buildPattern(query) {
  const cleaned = query.trim().replace(/[ً-ْـ]/g, '');
  if (cleaned.length < 2) return null;

  const body = [...cleaned]
    .map((char) => VARIANTS[char] ?? char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join(JOINER);

  try {
    return new RegExp(`(${body})`, 'gi');
  } catch {
    // A query that somehow still produces an invalid pattern must not take the
    // whole list down with it — just render the text unhighlighted.
    return null;
  }
}

function Highlight({ text, query }) {
  const value = text ?? '';
  if (!query?.trim()) return value;

  const pattern = buildPattern(query);
  if (!pattern) return value;

  const parts = value.split(pattern);
  if (parts.length === 1) return value;

  return parts.map((part, i) =>
    // split() with one capture group puts the matches at every odd index.
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-gold-100 px-0.5 text-ink-900">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
