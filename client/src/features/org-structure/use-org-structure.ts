import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { OrgAggregates } from '@/entities/org/aggregate';
import { ancestorIds, buildTree } from '@/entities/org/build-tree';
import type { OrgTree } from '@/entities/org/types';
import { useOrgLive, type LiveState } from '@/features/live';
import type { PatchField } from '@shared/types';
import { orgTreeQuery, retryOrgTreeOnce } from '@/shared/api/org-tree';

/**
 * `ready` and `error` are not exclusive: react-query keeps `data` while moving a
 * query to `status: 'error'`, so a failed refresh over cached data stays `ready`
 * and raises `isStale` instead. Only a failure with nothing cached is `error`.
 */
export type OrgStatus = 'pending' | 'error' | 'empty' | 'ready';

export interface Highlight {
  /** The patched node plus every ancestor whose roll-up moved with it. */
  nodeIds: ReadonlySet<string>;
  fields: ReadonlySet<PatchField>;
  at: number;
}

interface OrgStructureCommon {
  aggregates: OrgAggregates;
  totalHeadcount: number;
  isStale: boolean;
  isBackgroundRefetch: boolean;
  isRetrying: boolean;
  error: unknown;
  retry: () => void;
  live: LiveState;
  highlight: Highlight | null;
}

export type OrgStructure = OrgStructureCommon &
  ({ status: 'ready'; tree: OrgTree } | { status: Exclude<OrgStatus, 'ready'>; tree?: OrgTree });

const EMPTY_AGGREGATES = OrgAggregates.empty();

export function useOrgStructure(): OrgStructure {
  const queryClient = useQueryClient();
  const query = useQuery(orgTreeQuery());

  const tree = useMemo(() => (query.data ? buildTree(query.data) : undefined), [query.data]);

  /**
   * A patch reaches the cache as a whole new node array, so the tree is rebuilt
   * either way. What must not be redone is the roll-up: the live hook leaves the
   * patched id here, and the snapshot below supplies the previous totals, which
   * turns the recomputation into a walk up the ancestors instead of a full pass.
   */
  const patchedNodeRef = useRef<string | null>(null);
  const snapshotRef = useRef<OrgAggregates | null>(null);

  const live = useOrgLive({
    onNodePatched: useCallback((nodeId: string) => {
      patchedNodeRef.current = nodeId;
    }, []),
  });

  const aggregates = useMemo(() => {
    if (!tree) return EMPTY_AGGREGATES;

    const previous = snapshotRef.current;
    const patchedNode = patchedNodeRef.current;
    patchedNodeRef.current = null;

    // Falling back to a full pass is always correct, only slower — which is what
    // a repeated render under StrictMode gets.
    const next =
      previous && patchedNode
        ? previous.recomputeBranch(tree, patchedNode)
        : OrgAggregates.fromTree(tree);

    snapshotRef.current = next;
    return next;
  }, [tree]);

  const totalHeadcount = useMemo(
    () =>
      tree
        ? tree.roots.reduce((sum, root) => sum + (aggregates.get(root.id)?.headcount ?? 0), 0)
        : 0,
    [tree, aggregates],
  );

  const highlight = useMemo<Highlight | null>(() => {
    const patch = live.lastPatch;
    if (!tree || !patch) return null;

    return {
      nodeIds: new Set([patch.nodeId, ...ancestorIds(tree, patch.nodeId)]),
      fields: new Set(patch.fields),
      at: patch.at,
    };
  }, [tree, live.lastPatch]);

  const retry = useCallback(() => void retryOrgTreeOnce(queryClient), [queryClient]);

  const common: OrgStructureCommon = {
    aggregates,
    totalHeadcount,
    isStale: query.isError && tree !== undefined,
    isBackgroundRefetch: query.isFetching && !query.isPending,
    isRetrying: query.isFetching,
    error: query.error,
    retry,
    live,
    highlight,
  };

  if (!tree) {
    return { ...common, status: query.isError ? 'error' : 'pending' };
  }

  if (tree.size === 0) {
    return { ...common, status: 'empty', tree };
  }

  return { ...common, status: 'ready', tree };
}
