import { forwardRef, useId } from 'react';

/**
 * Accessible text input / textarea.
 *
 * Every field gets a real <label htmlFor>, and errors are wired through
 * aria-describedby + aria-invalid so a screen reader actually announces them.
 * The old forms had labels but no error association at all.
 */

const control =
  'block w-full rounded-lg border bg-surface px-3.5 text-ink-900 placeholder:text-ink-300 ' +
  'transition-[border-color,box-shadow] duration-200 ease-premium ' +
  'focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 ' +
  'disabled:bg-ink-50 disabled:text-ink-400';

export const Input = forwardRef(function Input(
  { label, error, hint, className = '', id, ...props },
  ref
) {
  const auto = useId();
  const fieldId = id || auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <Label htmlFor={fieldId} required={props.required}>
        {label}
      </Label>
      <input
        ref={ref}
        id={fieldId}
        className={`${control} h-11 ${error ? 'border-danger/50' : 'border-ink-100'}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      <Messages error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', id, rows = 5, ...props },
  ref
) {
  const auto = useId();
  const fieldId = id || auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <Label htmlFor={fieldId} required={props.required}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={`${control} resize-y py-2.5 leading-relaxed ${
          error ? 'border-danger/50' : 'border-ink-100'
        }`}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      <Messages error={error} errorId={errorId} hint={hint} hintId={hintId} />
    </div>
  );
});

function Label({ htmlFor, required, children }) {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
      {children}
      {required && (
        <span className="mr-1 text-gold-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function Messages({ error, errorId, hint, hintId }) {
  return (
    <>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}
