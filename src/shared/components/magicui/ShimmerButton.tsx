import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function ShimmerButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <button
      className={cn(
        'group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl px-6 font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60',
        'bg-[var(--accent)] shadow-[0_10px_30px_rgb(13_107_82_/_0.28)] hover:brightness-110',
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_25%,rgb(255_255_255_/_0.35)_50%,transparent_75%)] bg-[length:200%_100%] transition group-hover:animate-[shimmer_1.4s_linear]"
        aria-hidden
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
