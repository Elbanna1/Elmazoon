/**
 * Arabic search.
 *
 * The backend's `?search=` parameter does a plain substring match on the raw
 * stored string. In Arabic that fails on ordinary, correctly-spelled input, and
 * it fails silently — the visitor types a word that is *on the page* and is told
 * there are no results. Three reasons, all of them normal Arabic:
 *
 *  1. **Orthographic variants.** أ إ آ ٱ ا are the same letter to a reader and
 *     five different code points to `String.includes`. So are ى / ي and ة / ه.
 *     Someone searching `الاجانب` will not match a page that says `الأجانب`.
 *  2. **Diacritics.** `الطَّلاق` and `الطلاق` are the same word. One has harakat.
 *  3. **Prefix clitics.** Arabic glues ال / و / ب / ل / ك / ف onto the front of a
 *     word. `وللزوجة` and `الزوجة` and `زوجة` are one search intent.
 *
 * So search runs client-side over a normalized index instead. The corpus is
 * small — a few dozen pages and a few hundred fatwas — so this is a linear scan
 * over normalized strings, which is far faster than the round trip it replaces,
 * and it means typo tolerance and related searches cost nothing extra.
 */

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

const DIACRITICS = /[ً-ْٰـ]/g; // harakat, superscript alef, tatweel

/**
 * Fold a string to its comparable form.
 *
 * Every transformation here is one that a reader would consider "the same word".
 * Nothing here is lossy in a way that could merge two genuinely different words:
 * Arabic does not distinguish meaning by hamza seat or by ta-marbuta vs ha in the
 * way this folding assumes *for search purposes*, which is precisely why every
 * serious Arabic search stack (Lucene's ArabicNormalizer included) does exactly
 * this set.
 */
export function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا') // hamza seats -> bare alef
    .replace(/ى/g, 'ي') // alef maqsura -> ya
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/ة/g, 'ه') // ta marbuta -> ha
    .replace(/[^ء-يa-zA-Z0-9\s]/g, ' ') // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Strip the prefix clitics Arabic glues onto a word.
 *
 * Order matters: `وال` must come off before `ال`, or `والزواج` loses only its waw
 * and stays `الزواج`, which then fails to match a stored `زواج`.
 *
 * Only applied to tokens long enough to survive it. `له` must not become `ه`.
 */
function stem(token) {
  let out = token;

  for (const prefix of ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ب', 'ل', 'ف', 'ك']) {
    if (out.startsWith(prefix) && out.length - prefix.length >= 3) {
      out = out.slice(prefix.length);
      break;
    }
  }

  // Trailing feminine/plural markers that do not change the search intent.
  for (const suffix of ['ات', 'ين', 'ون', 'ها', 'هم', 'ه', 'ي']) {
    if (out.endsWith(suffix) && out.length - suffix.length >= 3) {
      out = out.slice(0, -suffix.length);
      break;
    }
  }

  return out;
}

/** Normalized, stemmed, de-duplicated tokens. Stop words carry no signal. */
const STOP_WORDS = new Set([
  'في', 'من', 'الي', 'علي', 'عن', 'مع', 'هل', 'ما', 'هو', 'هي', 'ان', 'او',
  'هذا', 'هذه', 'ذلك', 'كل', 'بين', 'يجوز', 'حكم', 'كيف', 'متي', 'اين', 'لماذا',
]);

export function tokenize(value) {
  const tokens = normalize(value)
    .split(' ')
    .filter(Boolean)
    .map(stem)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

  return [...new Set(tokens)];
}

/* ------------------------------------------------------------------ */
/* Typo tolerance                                                      */
/* ------------------------------------------------------------------ */

/**
 * Levenshtein distance, bailing out once it exceeds `max`.
 *
 * The early exit is what makes this affordable to run per-token per-document: a
 * pair that is already too far apart stops being measured, and most pairs are.
 */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }

    if (best > max) return max + 1;
    prev = row;
  }

  return prev[b.length];
}

/**
 * How far a typo may stray, by word length.
 *
 * A fixed threshold is wrong in both directions: distance 2 on a 3-letter word
 * matches almost anything, and distance 1 on a 12-letter word is stricter than
 * the typing error rate on a phone keyboard actually is.
 */
function tolerance(token) {
  if (token.length <= 3) return 0;
  if (token.length <= 6) return 1;
  return 2;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/**
 * Score one document against one query.
 *
 * Fields are weighted, because a term in the title means something different
 * from the same term buried in the body. Returns 0 when the document does not
 * answer the query at all — every query token must be satisfied *somehow*, so
 * that searching two words does not return everything matching either one.
 */
function scoreDocument(doc, queryTokens) {
  let total = 0;

  for (const token of queryTokens) {
    let best = 0;

    // Exact substring in a weighted field beats any fuzzy match.
    if (doc.title.includes(token)) best = 10;
    else if (doc.keywords.includes(token)) best = 6;
    else if (doc.body.includes(token)) best = 3;

    if (best === 0) {
      // Fuzzy: measure against the document's own tokens.
      const max = tolerance(token);
      if (max > 0) {
        for (const candidate of doc.tokens) {
          const distance = editDistance(token, candidate, max);
          if (distance <= max) {
            // A typo is worth less than a hit, and a worse typo is worth less
            // than a near one.
            best = Math.max(best, 4 - distance);
          }
        }
      }
    }

    // One unsatisfiable token disqualifies the document. Searching
    // "شروط الطلاق" must not return every page that merely says "شروط".
    if (best === 0) return 0;

    total += best;
  }

  return total;
}

/**
 * Build a searchable document. Called once per item, at module load or in
 * `getStaticProps` — never per keystroke.
 */
export function indexDocument({ id, href, title, body = '', keywords = [], kind, silo }) {
  const normalizedTitle = normalize(title);
  const normalizedBody = normalize(body);
  const normalizedKeywords = normalize(keywords.join(' '));

  return {
    id,
    href,
    kind,
    silo,
    label: title,
    excerpt: String(body).trim().slice(0, 160),
    title: normalizedTitle,
    body: normalizedBody,
    keywords: normalizedKeywords,
    // The union of every token in the document, for fuzzy comparison.
    tokens: [
      ...new Set([
        ...tokenize(title),
        ...tokenize(keywords.join(' ')),
        ...tokenize(body).slice(0, 120),
      ]),
    ],
  };
}

/** Rank an index against a query. Highest score first, stable within a score. */
export function search(index, query, { limit = 20 } = {}) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return index
    .map((doc) => ({ doc, score: scoreDocument(doc, tokens) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((hit) => hit.doc);
}

/**
 * "Did you mean" — the closest indexed title to a query that found nothing.
 *
 * Only offered when the query is genuinely close to something we have. A
 * suggestion that is merely the least-bad match is worse than admitting there is
 * no result, because it sends the reader to a page that does not answer them.
 */
export function suggest(index, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  let best = null;
  let bestDistance = Infinity;

  for (const doc of index) {
    for (const candidate of doc.tokens) {
      for (const token of tokens) {
        const max = tolerance(token) + 1;
        const distance = editDistance(token, candidate, max);
        if (distance <= max && distance < bestDistance) {
          bestDistance = distance;
          best = candidate;
        }
      }
    }
  }

  return bestDistance <= 2 ? best : null;
}

/**
 * Related searches.
 *
 * Not a recommendation engine — the corpus is far too small for co-occurrence to
 * mean anything. These are the queries a person asking *this* is statistically
 * about to ask next, drawn from the same topic cluster, which is what the feature
 * is actually for: keeping the reader on the site instead of back on Google.
 */
export function relatedSearches(index, query, { limit = 6 } = {}) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits = search(index, query, { limit: 3 });
  const silos = new Set(hits.map((hit) => hit.silo).filter(Boolean));
  if (silos.size === 0) return [];

  const seen = new Set(hits.map((hit) => hit.id));

  return index
    .filter((doc) => silos.has(doc.silo) && !seen.has(doc.id))
    .slice(0, limit)
    .map((doc) => doc.label);
}
