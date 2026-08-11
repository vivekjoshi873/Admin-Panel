import { Link } from 'react-router-dom';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
        <Link to="/login" className="font-display text-xl font-semibold tracking-tight">
          Bingo Admin
        </Link>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)]/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
