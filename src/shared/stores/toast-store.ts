import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  createdAt: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id' | 'createdAt'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

let toastSeq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (toast) => {
    const id = toast.id ?? `toast-${++toastSeq}-${Date.now()}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          title: toast.title,
          description: toast.description,
          tone: toast.tone,
          createdAt: Date.now(),
        },
      ].slice(-5),
    }));

    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4200);

    return id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

export function toast(input: {
  title: string;
  description?: string;
  tone?: ToastTone;
}) {
  return useToastStore.getState().push({
    title: input.title,
    description: input.description,
    tone: input.tone ?? 'info',
  });
}
