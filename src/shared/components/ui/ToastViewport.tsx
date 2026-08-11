import { useToastStore } from '@/shared/stores/toast-store';
import { cn } from '@/shared/lib/cn';

const toneClass = {
  success: 'border-emerald-600/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100',
  error: 'border-red-600/30 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100',
  info: 'border-sky-600/30 bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100',
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur',
            toneClass[t.tone],
          )}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs opacity-80">{t.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => dismiss(t.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
