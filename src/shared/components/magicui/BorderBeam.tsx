import { cn } from '@/shared/lib/cn';

/** Magic UI border beam — animated light traveling along the card edge. */
export function BorderBeam({
  className,
  size = 180,
  duration = 10,
  colorFrom = '#0d6b52',
  colorTo = '#3dcf9a',
}: {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]',
        className,
      )}
      style={{ border: '1px solid transparent' }}
    >
      <div
        className="absolute aspect-square"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          animation: `border-beam ${duration}s infinite linear`,
          offsetAnchor: '100% 50%',
        }}
      />
    </div>
  );
}
