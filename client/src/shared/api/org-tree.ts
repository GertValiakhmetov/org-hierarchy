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

export const orgTreeQuery = () =>
  queryOptions({
    queryKey: orgTreeKeys.all,
    queryFn: ({ signal }) => fetchOrgTree(signal),
    staleTime: 5_000,
  });

export async function retryOrgTreeOnce(queryClient: QueryClient): Promise<void> {
  await queryClient
    .fetchQuery({ ...orgTreeQuery(), retry: false, staleTime: 0 })
    .catch(() => undefined);
}
