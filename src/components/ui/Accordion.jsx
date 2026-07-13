import { useId, useState } from 'react';

/**
 * The old accordion was a <div onClick> — not focusable, not keyboard-operable,
 * no aria-expanded. Keyboard and screen-reader users could not open a single
 * FAQ. This is a real <button> with the correct disclosure semantics.
 *
 * The open/close animation is CSS grid-rows (0fr -> 1fr), which is GPU-cheap and
 * needs no measurement pass, unlike animating `height: auto` in JS.
 */
export default function Accordion({ items = [] }) {
  const [open, setOpen] = useState(null);
  const base = useId();

  return (
    <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-subtle">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${base}-trigger-${i}`;
        const panelId = `${base}-panel-${i}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-start transition-colors duration-200 hover:bg-ink-50/60 sm:px-6"
              >
                <span className="text-[0.9375rem] font-medium leading-relaxed text-ink-900 sm:text-base">
                  {item.question}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-400 transition-all duration-300 ease-premium group-hover:border-gold-300 group-hover:text-gold-600 ${
                    isOpen ? 'rotate-180 border-gold-300 bg-gold-50 text-gold-600' : ''
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path
                      d="m6 9 6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>

            {/* The panel stays mounted and collapses to 0fr, which is what makes
                the transition possible at all — `hidden` sets display:none, and
                a display:none element cannot transition, so the animation this
                component was written for never actually ran.

                The panel holds nothing focusable, so leaving it in the DOM
                collapsed costs no tab stops. `inert` keeps it out of the
                accessibility tree while closed. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={isOpen ? undefined : ''}
              className="grid transition-[grid-template-rows] duration-300 ease-premium"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-5 pb-6 text-[0.9375rem] leading-[1.95] text-ink-500 transition-opacity duration-300 ease-premium sm:px-6 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
