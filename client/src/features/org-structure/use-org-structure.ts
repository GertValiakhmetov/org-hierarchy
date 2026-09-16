import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { aggregateTree, type OrgAggregates } from '@/entities/org/aggregate';
import { buildTree } from '@/entities/org/build-tree';
import type { OrgTree } from '@/entities/org/types';
import { orgTreeQuery, retryOrgTreeOnce } from '@/shared/api/org-tree';

/**
 * `ready` and `error` are not exclusive: react-query keeps `data` while moving a
 * query to `status: 'error'`, so a failed refresh over cached data stays `ready`
 * and raises `isStale` instead. Only a failure with nothing cached is `error`.
 */
export type OrgStatus = 'pending' | 'error' | 'empty' | 'ready';

interface OrgStructureCommon {
  aggregates: OrgAggregates;
  totalHeadcount: number;
  isStale: boolean;
  isBackgroundRefetch: boolean;
  isRetrying: boolean;
  error: unknown;
  retry: () => void;
}

export type OrgStructure = OrgStructureCommon &
  ({ status: 'ready'; tree: OrgTree } | { status: Exclude<OrgStatus, 'ready'>; tree?: OrgTree });

const EMPTY_AGGREGATES: OrgAggregates = new Map();

export function useOrgStructure(): OrgStructure {
  const queryClient = useQueryClient();
  const query = useQuery(orgTreeQuery());

  const tree = useMemo(() => (query.data ? buildTree(query.data) : undefined), [query.data]);

  const aggregates = useMemo(() => (tree ? aggregateTree(tree) : EMPTY_AGGREGATES), [tree]);

  const totalHeadcount = useMemo(
    () =>
      tree
        ? tree.roots.reduce((sum, root) => sum + (aggregates.get(root.id)?.headcount ?? 0), 0)
        : 0,
    [tree, aggregates],
  );

  const retry = useCallback(() => retryOrgTreeOnce(queryClient), [queryClient]);

  const common: OrgStructureCommon = {
    aggregates,
    totalHeadcount,
    isStale: query.isError && tree !== undefined,
    isBackgroundRefetch: query.isFetching && !query.isPending,
    isRetrying: query.isFetching,
    error: query.error,
    retry,
  };

  if (!tree) {
    return { ...common, status: query.isError ? 'error' : 'pending' };
  }

  if (tree.size === 0) {
    return { ...common, status: 'empty', tree };
  }

  return { ...common, status: 'ready', tree };
}
