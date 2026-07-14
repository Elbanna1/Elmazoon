import { useEffect, useRef, useState } from 'react';
import Reveal from '@/components/Reveal';
import Button from '@/components/ui/Button';
import { Container, Section, SectionHeading } from '@/components/ui/Layout';
import { site } from '@/lib/site';

/**
 * The office, with a map.
 *
 * The map is an iframe, and an iframe is a whole second document — Google's embed
 * pulls several hundred KB of tiles and script. Rendering it eagerly would put all
 * of that on the homepage's critical path for a section most visitors never scroll
 * to, so it is mounted only once it is about to come into view. Until then the
 * frame is an empty styled box of exactly the same size, which means the swap costs
 * no layout shift.
 *
 * The button is the real affordance and does not depend on the iframe: it is a
 * plain link to the pin, so it works with JavaScript off, on a slow connection,
 * and inside the Google Maps app on a phone.
 */
export default function OfficeLocation() {
  const frameRef = useRef(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || showMap) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowMap(true);
          observer.disconnect();
        }
      },
      // Start fetching a little before it is on screen, so it has usually painted
      // by the time the visitor arrives at it.
      { rootMargin: '300px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [showMap]);

  return (
    <Section id="location" className="scroll-mt-24" aria-labelledby="location-heading">
      <Container>
        <Reveal>
          <SectionHeading
            id="location-heading"
            eyebrow="المكتب"
            title={site.office.heading}
            lede="يمكنك زيارة المكتب أو الاتفاق على حضور المأذون إلى مكان المناسبة."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-ink-100 bg-surface shadow-card">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-[1.375rem] w-[1.375rem]">
                    <path
                      d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="10.5"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                  </svg>
                </span>

                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-semibold text-ink-900">العنوان</h3>
                  <p className="ugc mt-1.5 text-[0.9375rem] leading-[1.95] text-ink-600">
                    {site.office.address}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href={site.office.mapsUrl} variant="primary">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[1.125rem] w-[1.125rem]"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
                  </svg>
                  فتح الموقع على خرائط Google
                </Button>

                <Button href={site.phone.href} variant="secondary">
                  <span className="ltr-nums">{site.phone.display}</span>
                </Button>
              </div>
            </div>

            {/* Fixed aspect box. The iframe fills it when it mounts, so nothing
                below the map moves when it loads. */}
            <div
              ref={frameRef}
              className="relative aspect-[4/3] w-full border-t border-ink-100 bg-ink-50 sm:aspect-[21/9]"
            >
              {showMap && (
                <iframe
                  src={site.office.embedUrl}
                  title={`موقع مكتب ${site.fullName} على خرائط Google`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
