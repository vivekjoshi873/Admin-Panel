import { cn } from '@/shared/lib/cn';

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn('inline-flex items-center gap-2', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]/25"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label ? <span className="text-sm text-[var(--ink)]">{label}</span> : null}
    </label>
  );
}
