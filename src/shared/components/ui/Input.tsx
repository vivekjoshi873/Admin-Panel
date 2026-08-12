import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  /** Show an eye toggle when type is password. */
  revealable?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, type = 'text', revealable = false, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password' || revealable;
  const showToggle = revealable || type === 'password';
  const resolvedType = showToggle && isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium tracking-tight text-[var(--ink)]">{label}</span> : null}
      <span className="relative block">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={cn(
            'h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] px-3.5 text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)]/80',
            'shadow-[inset_0_1px_0_rgb(255_255_255_/_0.4)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            showToggle && 'pr-11',
            error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {showToggle ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-black/[0.04] hover:text-[var(--ink)] dark:hover:bg-white/[0.06]"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
});
