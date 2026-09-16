import { useCallback, useMemo, useState } from 'react';
import { ancestorIds } from '@/entities/org/build-tree';
import type { OrgTree } from '@/entities/org/types';

export interface TreeNavigation {
  expanded: ReadonlySet<string>;
  selectedId: string | null;
  toggle: (nodeId: string) => void;
  select: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/**
 * Expansion and selection kept together because they are not independent:
 * selecting a node from the table has to open the branch holding it, and
 * keyboard navigation reads both at once.
 *
 * Roots start expanded, which is what makes the second level visible by
 * default. The user's choice is held separately from that default instead of
 * being seeded into state, so a background revalidation returning a new tree
 * object cannot collapse branches the user has opened.
 */
export function useTreeNavigation(tree: OrgTree | undefined): TreeNavigation {
  const [override, setOverride] = useState<ReadonlySet<string> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaults = useMemo(() => new Set<string>(tree?.roots.map((root) => root.id) ?? []), [tree]);

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

  const select = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);

      if (!tree) return;
      const ancestors = ancestorIds(tree, nodeId);
      if (ancestors.length === 0) return;

      setOverride((previous) => {
        const base = previous ?? defaults;
        if (ancestors.every((id) => base.has(id))) {
          // Already visible — returning the same set avoids a pointless re-render.
          return previous;
        }

        const next = new Set(base);
        for (const id of ancestors) {
          next.add(id);
        }
        return next;
      });
    },
    [tree, defaults],
  );

  const expandAll = useCallback(() => setOverride(new Set(tree?.order ?? [])), [tree]);
  const collapseAll = useCallback(() => setOverride(new Set()), []);

  return { expanded, selectedId, toggle, select, expandAll, collapseAll };
}
