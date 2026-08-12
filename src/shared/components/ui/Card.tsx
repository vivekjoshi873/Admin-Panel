import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { BorderBeam } from '@/shared/components/magicui/BorderBeam';

export function Card({
  children,
  className,
  beam = false,
}: {
  children: ReactNode;
  className?: string;
  beam?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]/75 p-4 shadow-[0_10px_30px_rgb(20_24_22_/_0.04)] backdrop-blur',
        className,
      )}
    >
      {beam ? <BorderBeam duration={14} size={120} /> : null}
      {children}
    </div>
  );
}
