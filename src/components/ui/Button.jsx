import { forwardRef } from 'react';
import Link from 'next/link';
import Spinner from './Spinner';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg select-none ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-premium ' +
  'active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  // Exactly one primary action per view. Gold is reserved for it.
  // White on gold-500 measures 3.77:1 — below the 4.5:1 AA floor for body-size
  // text. gold-600 is 4.86:1: same hue, one step down the existing ramp.
  primary: 'bg-gold-600 text-white shadow-subtle hover:bg-gold-700 hover:shadow-card',
  // The main dark action — used for the hero CTA where gold would be too loud.
  ink: 'bg-ink-900 text-white shadow-subtle hover:bg-ink-800 hover:shadow-card',
  secondary: 'bg-surface text-ink-800 border border-ink-100 hover:border-ink-200 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:text-ink-900 hover:bg-ink-50',
  danger: 'bg-surface text-danger border border-danger/20 hover:bg-danger hover:text-white',
  // Secondary action on a dark surface (the closing CTA band).
  inverse: 'border border-white/15 bg-white/5 text-white hover:bg-white/10',
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-[3.25rem] px-7 text-base',
};

const Button = forwardRef(function Button(
  {
    as,
    href,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    const isExternal = /^https?:/.test(href);
    // `tel:` and `mailto:` hand off to another app. Opening them in a new tab
    // leaves a blank orphan tab behind on mobile after the dialer takes over.
    const isHandoff = /^(tel:|mailto:)/.test(href);
    const Cmp = isExternal || isHandoff ? 'a' : Link;
    const extra = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

    return (
      <Cmp
        ref={ref}
        href={href}
        className={classes}
        // A link cannot be `disabled`, so a caller passing `loading` to an
        // anchor used to get a button that looked idle and stayed clickable.
        aria-disabled={disabled || loading || undefined}
        {...extra}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </Cmp>
    );
  }

  const Cmp = as || 'button';
  return (
    <Cmp
      ref={ref}
      className={classes}
      // A submit button that stays clickable while in flight is how you get
      // duplicate questions in the database.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </Cmp>
  );
});

export default Button;
