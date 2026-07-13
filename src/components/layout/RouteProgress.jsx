import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * A 2px progress bar on route change.
 *
 * Replaces `TransitionEffect`, which mounted three full-screen fixed overlays
 * and wiped them across the viewport for 0.8s on every navigation — while
 * `AnimatedText` separately held the heading back for another 1s. The result
 * was over a second of coloured blank screen per page, which reads as a broken
 * site rather than a transition.
 *
 * Those overlays also used `w-screen`, which includes the scrollbar width and
 * caused horizontal overflow on desktop.
 */
export default function RouteProgress() {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | loading | done

  useEffect(() => {
    let doneTimer;

    const start = () => {
      clearTimeout(doneTimer);
      setState('loading');
    };
    const finish = () => {
      setState('done');
      doneTimer = setTimeout(() => setState('idle'), 300);
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', finish);
    router.events.on('routeChangeError', finish);

    return () => {
      clearTimeout(doneTimer);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', finish);
      router.events.off('routeChangeError', finish);
    };
  }, [router.events]);

  if (state === 'idle') return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="جارٍ تحميل الصفحة"
      // A progressbar with no value is announced as "0%" by some screen readers
      // and as nothing at all by others.
      aria-valuenow={state === 'done' ? 100 : 70}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gold-500 transition-[width,opacity] ease-premium"
        style={{
          width: state === 'done' ? '100%' : '70%',
          opacity: state === 'done' ? 0 : 1,
          transitionDuration: state === 'done' ? '200ms' : '900ms',
        }}
      />
    </div>
  );
}
