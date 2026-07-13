import { useEffect, useRef, useState } from 'react';

/**
 * Fade-and-rise on scroll, once.
 *
 * Uses IntersectionObserver + a CSS transition instead of framer-motion's
 * `whileInView`. Same effect, but it does not pull a ~50KB animation runtime
 * into the bundle for what is a six-line transition.
 */
export default function Reveal({ as: Cmp = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // If the user prefers reduced motion, show immediately and never animate.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Cmp
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-premium ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Cmp>
  );
}
