/**
 * Layout primitives.
 *
 * Replaces the old `Layout` component, whose 128px base padding (`p-32`) was
 * responsible for most of the empty space on the site — and whose `classname`
 * prop was silently dropped on any caller that spelled it `className`.
 */

export function Container({ as: Cmp = 'div', size = 'default', className = '', children }) {
  const widths = {
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
  };
  return (
    <Cmp className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${widths[size]} ${className}`}>
      {children}
    </Cmp>
  );
}

/** Consistent vertical rhythm between page sections. */
export function Section({ as: Cmp = 'section', spacing = 'default', className = '', children, ...props }) {
  const spacings = {
    tight: 'py-12 sm:py-16',
    default: 'py-16 sm:py-20 lg:py-24',
    loose: 'py-20 sm:py-28 lg:py-32',
  };
  return (
    <Cmp className={`${spacings[spacing]} ${className}`} {...props}>
      {children}
    </Cmp>
  );
}

/**
 * Eyebrow + title + optional lede. Used at the top of every section.
 *
 * `as` defaults to `h2` because most uses are sections of a page that already has
 * an `h1`. The *page's* own heading must pass `as="h1"` — a page with no `h1` has
 * no primary heading for Google to rank on and no landmark for a screen-reader
 * user to jump to, which is exactly what the articles and questions pages were
 * shipping.
 */
export function SectionHeading({
  as: Heading = 'h2',
  eyebrow,
  title,
  lede,
  align = 'center',
  id,
  className = '',
}) {
  const alignment = align === 'start' ? 'text-start' : 'text-center mx-auto';

  // An h1 carries the page, so it is set a step larger than a section heading.
  const size =
    Heading === 'h1'
      ? 'text-[1.75rem] sm:text-4xl lg:text-[2.5rem]'
      : 'text-2xl sm:text-3xl lg:text-[2.125rem]';

  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
          {eyebrow}
        </p>
      )}
      <Heading
        id={id}
        className={`text-balance font-semibold tracking-tight text-ink-900 ${size}`}
      >
        {title}
      </Heading>
      {lede && (
        <p className="mt-4 text-base leading-[1.9] text-ink-500 sm:text-[1.0625rem]">{lede}</p>
      )}
    </div>
  );
}
