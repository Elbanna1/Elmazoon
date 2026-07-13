import { useEffect, useRef, useState } from 'react';

/**
 * How far through the fatwa you are.
 *
 * Progress is measured against the article element, not the document, so the
 * bar reaches 100% at the end of the *text* rather than at the end of the
 * footer — a bar that still reads 60% when you have finished reading is worse
 * than no bar at all.
 *
 * The scroll handler is passive and does its work inside rAF, so it never
 * blocks the scroll thread.
 */
export default function ReadingProgress({ targetRef }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return undefined;

    const measure = () => {
      const { top, height } = el.getBoundingClientRect();
      // The article is "read" once its bottom reaches the bottom of the viewport.
      const distance = height - window.innerHeight;
      if (distance <= 0) {
        setProgress(top <= 0 ? 100 : 0);
        return;
      }
      const scrolled = (-top / distance) * 100;
      setProgress(Math.min(100, Math.max(0, scrolled)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return (
    <div
      // Above the sticky navbar (z-40), below the route-change bar (z-60).
      className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent"
      role="progressbar"
      aria-label="تقدّم القراءة"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gold-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
