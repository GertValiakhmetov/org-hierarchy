import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delayMs`, collapsing bursts into a single update.
 *
 * Typing stays instant because the caller keeps the raw value for the input;
 * only the derived value used for filtering is delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
