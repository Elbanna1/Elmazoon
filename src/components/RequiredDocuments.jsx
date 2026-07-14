import Reveal from '@/components/Reveal';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { requiredDocuments, requiredDocumentsNote } from '@/lib/site';

/**
 * The paperwork checklist.
 *
 * An ordered list, because the source numbers it and because the numbering is
 * part of the content rather than decoration. The Arabic-Indic ordinal is printed
 * inline at the head of each line — exactly as supplied — so the list reads the
 * same whether or not the icons render.
 *
 * The icons are local to this file. They are the only place in the product that
 * needs them, and putting eight one-off glyphs into SocialIcon (which exists to
 * map *brands* to marks) would be the wrong home for them.
 */

/* Stroke-only, 24px box, 1.75 weight — the same drawing grammar as every other
   icon on the site. Anything heavier reads as clip-art next to the hairlines. */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const icons = {
  // National ID — card with a portrait.
  idCard: (
    <>
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" {...stroke} />
      <circle cx="8.5" cy="11" r="2" {...stroke} />
      <path d="M5.5 16.25a3.25 3.25 0 0 1 6 0M14 10.5h4.25M14 14h3" {...stroke} />
    </>
  ),
  // National ID — the reverse, data lines only.
  idCardAlt: (
    <>
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" {...stroke} />
      <path d="M6.5 9.5h11M6.5 12.5h11M6.5 15.5h6" {...stroke} />
    </>
  ),
  // The bride's guardian — two people.
  guardian: (
    <>
      <circle cx="9" cy="8" r="3.25" {...stroke} />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...stroke} />
      <path d="M16 5.6a3.25 3.25 0 0 1 0 6.3M17.5 14.4a5.5 5.5 0 0 1 3 4.6" {...stroke} />
    </>
  ),
  // Passport photographs.
  photo: (
    <>
      <rect x="2.75" y="6" width="18.5" height="14" rx="2.5" {...stroke} />
      <path d="M8 6l1.4-2.2h5.2L16 6" {...stroke} />
      <circle cx="12" cy="13" r="3.5" {...stroke} />
    </>
  ),
  // Medical certificate.
  health: (
    <>
      <path
        d="M12 20.5S4.75 16.2 4.75 10.8A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.25 2.2c0 5.4-7.25 9.7-7.25 9.7Z"
        {...stroke}
      />
      <path d="M8.5 12.6h2L11.6 11l1.4 3 1-1.4h1.5" {...stroke} />
    </>
  ),
  // Divorce deed — a document, severed.
  divorce: (
    <>
      <path d="M13.5 2.75H7A1.75 1.75 0 0 0 5.25 4.5v5" {...stroke} />
      <path d="M18.75 9V8L13.5 2.75V8h5.25" {...stroke} />
      <path d="M5.25 14.5v5A1.75 1.75 0 0 0 7 21.25h10a1.75 1.75 0 0 0 1.75-1.75v-5" {...stroke} />
      <path d="M3 12h4.5M10.25 12h3.5M16.5 12H21" {...stroke} />
    </>
  ),
  // Marriage document + death certificate — a stack.
  documents: (
    <>
      <path d="M8.75 2.75H15l4.25 4.25v10.5a1.75 1.75 0 0 1-1.75 1.75h-8.75A1.75 1.75 0 0 1 7 17.5V4.5a1.75 1.75 0 0 1 1.75-1.75Z" {...stroke} />
      <path d="M14.5 2.75V7.5h4.75" {...stroke} />
      <path d="M4.25 6.5A1.75 1.75 0 0 0 3.5 8v11.5a1.75 1.75 0 0 0 1.75 1.75h9" {...stroke} />
    </>
  ),
  // Birth certificate — a document under seal.
  certificate: (
    <>
      <path d="M18.75 12.5V8L13.5 2.75H7A1.75 1.75 0 0 0 5.25 4.5v15A1.75 1.75 0 0 0 7 21.25h4" {...stroke} />
      <path d="M13.5 2.75V8h5.25M8.75 8.5h2.5M8.75 12h4" {...stroke} />
      <circle cx="17" cy="16.75" r="3" {...stroke} />
      <path d="M15.4 19.3 15 22.5l2-1 2 1-.4-3.2" {...stroke} />
    </>
  ),
};

function DocIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.375rem] w-[1.375rem]" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function RequiredDocuments() {
  return (
    <Section id="documents" className="scroll-mt-24 bg-surface" aria-labelledby="documents-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="documents-heading"
            eyebrow="قبل الموعد"
            title="الأوراق المطلوبة لإتمام عقد الزواج"
            lede="جهّز هذه المستندات قبل الحضور، حتى يتم توثيق العقد في الموعد دون تأجيل."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div className="rounded-3xl border border-ink-100 bg-paper p-5 shadow-card sm:p-8 lg:p-10">
            <ol className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {requiredDocuments.map((doc) => (
                <li
                  key={doc.n}
                  className="flex items-start gap-4 rounded-2xl p-3 transition-colors duration-200 ease-premium hover:bg-gold-50/60 sm:p-4"
                >
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100"
                    aria-hidden="true"
                  >
                    <DocIcon name={doc.icon} />
                  </span>

                  {/* `min-w-0` — without it a long unbroken run inside a flex item
                      cannot shrink below its content, and the row pushes the page
                      sideways on a 320px screen. */}
                  <p className="ugc min-w-0 text-[0.9375rem] leading-[1.95] text-ink-700">
                    <span className="font-semibold text-gold-600">{doc.n}-</span> {doc.text}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-6 flex items-start gap-3 rounded-2xl border border-gold-100 bg-gold-50 p-4 text-[0.9375rem] leading-[1.9] text-ink-700 sm:mt-8 sm:p-5">
              <span className="mt-0.5 shrink-0 text-gold-600" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <circle cx="12" cy="12" r="9.25" {...stroke} />
                  <path d="M12 11.25v5M12 7.75h.01" {...stroke} />
                </svg>
              </span>
              <span className="min-w-0">{requiredDocumentsNote}</span>
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
