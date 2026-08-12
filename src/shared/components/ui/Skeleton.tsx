import { cn } from '@/shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-black/[0.06] via-black/[0.1] to-black/[0.06] dark:from-white/[0.06] dark:via-white/[0.1] dark:to-white/[0.06]',
        className,
      )}
    />
  );
}
