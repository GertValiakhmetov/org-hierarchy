import { useCallback, useEffect, useRef, useState } from 'react';

const ROW_SELECTOR = 'tr[data-row]';

export interface RowFocus {
  index: number;
  bodyRef: React.RefObject<HTMLTableSectionElement | null>;
  onKeyDown: (event: React.KeyboardEvent) => void;
  /** Delegated: keeps row props stable, which is what preserves their memo. */
  onBodyClick: (event: React.MouseEvent) => void;
}

interface UseRowFocusOptions {
  rowCount: number;
  onActivate: (index: number) => void;
}

/**
 * Roving focus over table rows: exactly one row is tabbable, arrows move it and
 * Enter activates. Focus is moved by querying the body rather than by holding a
 * ref per row, which would give every row a new prop on each render and defeat
 * their memoisation.
 */
export function useRowFocus({ rowCount, onActivate }: UseRowFocusOptions): RowFocus {
  const [index, setIndex] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  // Filtering can shrink the list under the cursor.
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(rowCount - 1, 0)));
  }, [rowCount]);

  const focusRow = useCallback((next: number) => {
    const row = bodyRef.current?.querySelectorAll<HTMLElement>(ROW_SELECTOR)[next];
    row?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (rowCount === 0) return;
      const last = rowCount - 1;
      let next = index;

      switch (event.key) {
        case 'ArrowDown':
          next = Math.min(index + 1, last);
          break;
        case 'ArrowUp':
          next = Math.max(index - 1, 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = last;
          break;
        case 'Enter':
          event.preventDefault();
          onActivate(index);
          return;
        default:
          return;
      }

      event.preventDefault();
      setIndex(next);
      focusRow(next);
    },
    [index, rowCount, onActivate, focusRow],
  );

  const onBodyClick = useCallback((event: React.MouseEvent) => {
    const body = bodyRef.current;
    const row = (event.target as HTMLElement).closest<HTMLElement>(ROW_SELECTOR);
    if (!body || !row) return;

    const clicked = [...body.querySelectorAll<HTMLElement>(ROW_SELECTOR)].indexOf(row);
    if (clicked >= 0) setIndex(clicked);
  }, []);

  return { index, bodyRef, onKeyDown, onBodyClick };
}
