import { useCallback, useMemo, useState } from 'react';
import type { OrgTree } from '@/entities/org/types';

export interface ExpansionState {
  expanded: ReadonlySet<string>;
  toggle: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isDefault: boolean;
}

/**
 * Roots start expanded, which is what makes the second level visible by default.
 *
 * The user's choice is held separately from that default instead of being
 * seeded into state, so a background revalidation returning a new tree object
 * cannot collapse branches the user has opened.
 */
export function useExpanded(tree: OrgTree | undefined): ExpansionState {
  const [override, setOverride] = useState<ReadonlySet<string> | null>(null);

  const defaults = useMemo(
    () => new Set<string>(tree?.roots.map((root) => root.id) ?? []),
    [tree],
  );

  const expanded = override ?? defaults;

  const toggle = useCallback(
    (nodeId: string) => {
      setOverride((previous) => {
        const next = new Set(previous ?? defaults);
        if (!next.delete(nodeId)) {
          next.add(nodeId);
        }
        return next;
      });
    },
    [defaults],
  );

  const expandAll = useCallback(() => {
    setOverride(new Set(tree?.order ?? []));
  }, [tree]);

  const collapseAll = useCallback(() => {
    setOverride(new Set());
  }, []);

  return { expanded, toggle, expandAll, collapseAll, isDefault: override === null };
}
