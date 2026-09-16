import { useEffect, useState } from 'react';

/**
 * Turns true whenever `trigger` changes to a new number, then back after
 * `durationMs`. Passing the same trigger again does nothing, so an unrelated
 * re-render cannot replay the animation.
 */
export function useFlash(trigger: number | undefined, durationMs: number): boolean {
  const [flashingAt, setFlashingAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (trigger === undefined) return;

    setFlashingAt(trigger);
    const timer = setTimeout(() => setFlashingAt(undefined), durationMs);
    return () => clearTimeout(timer);
  }, [trigger, durationMs]);

  return flashingAt !== undefined;
}
