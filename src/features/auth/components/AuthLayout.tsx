import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Particles } from '@/shared/components/magicui/Particles';
import { BorderBeam } from '@/shared/components/magicui/BorderBeam';
import { BlurFade } from '@/shared/components/magicui/BlurFade';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <Particles quantity={42} />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <Link to="/login" className="font-display text-2xl font-semibold tracking-tight text-gradient">
          Bingo
        </Link>
        <span className="rounded-full border border-[var(--line)] bg-[var(--surface)]/70 px-3 py-1 text-xs font-medium text-[var(--muted)] backdrop-blur">
          Admin Panel
        </span>
      </div>

      <BlurFade className="relative z-10 w-full max-w-md">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <BorderBeam duration={12} size={160} />
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Welcome
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </BlurFade>
    </div>
  );
}
