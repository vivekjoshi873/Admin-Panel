import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-[var(--btn-on-accent)] shadow-[0_10px_24px_rgb(13_107_82_/_0.22)] hover:brightness-110',
        secondary:
          'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
        ghost: 'bg-transparent text-[var(--ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]',
        danger: 'bg-[var(--danger)] text-white shadow-sm hover:brightness-110',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, disabled, asChild = false, children, style, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const resolvedVariant = variant ?? 'primary';
  const onAccentStyle =
    resolvedVariant === 'primary'
      ? ({ color: 'var(--btn-on-accent)', ...style } as CSSProperties)
      : style;

  // Slot (asChild) requires exactly one element child — never inject Loader beside it.
  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        style={style}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      style={onAccentStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Comp>
  );
});

export { buttonVariants };
