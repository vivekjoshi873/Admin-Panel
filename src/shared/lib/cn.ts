import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (typeof error === 'object' && error !== null) {
    const maybeAxios = error as {
      response?: { data?: { message?: string | string[]; error?: string } };
      message?: string;
    };

    const apiMessage = maybeAxios.response?.data?.message;
    if (Array.isArray(apiMessage)) return apiMessage.join(', ');
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    if (maybeAxios.response?.data?.error) return maybeAxios.response.data.error;
    if (maybeAxios.message) return maybeAxios.message;
  }

  return fallback;
}

export function displayName(user: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  if (user.fullName?.trim()) return user.fullName.trim();
  const joined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return joined || user.email;
}
