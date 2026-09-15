import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { OrgNodeDto } from '@shared/types';
import { fetchJson } from '@/shared/transport/http';
import { parseOrgTreeResponse } from './org-tree.schema';

export const orgTreeKeys = {
  all: ['org-tree'] as const,
};

async function fetchOrgTree(signal: AbortSignal): Promise<OrgNodeDto[]> {
  return parseOrgTreeResponse(await fetchJson('/api/org-tree', signal));
}

/**
 * One cache key for the whole app, parameterised by nothing: debug modes are
 * switched server-side so that failures reproduce on this very query instead of
 * on a neighbouring key with an empty cache.
 *
 * `staleTime` implements the required stale-while-revalidate window — inside
 * five seconds the cache answers without touching the network, past it the
 * cached data still renders immediately and the refresh goes out in background.
 */
export const orgTreeQuery = () =>
  queryOptions({
    queryKey: orgTreeKeys.all,
    queryFn: ({ signal }) => fetchOrgTree(signal),
    staleTime: 5_000,
  });

/**
 * The "retry" button in an error state.
 *
 * Deliberately not `refetch()`: that path obeys the automatic retry policy and
 * would fire three requests over several seconds for a single click, leaving the
 * button dead with no explanation. An explicit click means one attempt, and the
 * user decides whether to click again.
 *
 * `staleTime: 0` forces the request through — without it a still-fresh cache
 * entry would make this a no-op and the button would do nothing at all.
 */
export async function retryOrgTreeOnce(queryClient: QueryClient): Promise<void> {
  await queryClient
    .fetchQuery({ ...orgTreeQuery(), retry: false, staleTime: 0 })
    .catch(() => undefined);
}
