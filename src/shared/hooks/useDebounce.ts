import { useEffect, useState } from 'react';

/** 280ms is enough to skip keystroke spam without feeling laggy on search fields. */
export function useDebounce<T>(value: T, delayMs = 280): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
