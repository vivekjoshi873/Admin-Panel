import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-300/70 dark:bg-stone-700/60',
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '66%' : '100%' }}
        />
      ))}
    </div>
  );
}
