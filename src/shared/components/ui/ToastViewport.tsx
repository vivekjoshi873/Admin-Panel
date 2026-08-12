import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/shared/stores/toast-store';
import { cn } from '@/shared/lib/cn';

const toneClass = {
  success: 'border-emerald-500/25 bg-emerald-50/95 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-50',
  error: 'border-red-500/25 bg-red-50/95 text-red-950 dark:bg-red-950/70 dark:text-red-50',
  info: 'border-sky-500/25 bg-sky-50/95 text-sky-950 dark:bg-sky-950/70 dark:text-sky-50',
};

const toneIcon = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = toneIcon[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl',
              toneClass[t.tone],
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed opacity-80">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
