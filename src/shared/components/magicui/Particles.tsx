import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Particle = {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};

/** Magic UI–style floating particle field for auth / hero surfaces. */
export function Particles({
  className,
  quantity = 36,
  color = 'var(--accent)',
}: {
  className?: string;
  quantity?: number;
  color?: string;
}) {
  const [ready, setReady] = useState(false);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: quantity }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.4 + 0.8,
      duration: Math.random() * 8 + 10,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.45 + 0.15,
    }));
  }, [quantity]);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
