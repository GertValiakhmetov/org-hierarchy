import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import type { OrgFilter, SearchFallbackReason, SearchSource, SortSpec } from '@shared/types';
import { searchOrg } from '@/shared/api/search';

const SEARCH_CACHE_MS = 5 * 60_000;

export interface SearchState {
  submit: (query: string) => void;
  isRunning: boolean;
  source: SearchSource | null;
  reason: SearchFallbackReason | null;
}

interface UseOrgSearchOptions {
  onResult: (filter: OrgFilter, sort?: SortSpec) => void;
}

const IDLE = { isRunning: false, source: null, reason: null } as const;

export function useOrgSearch({ onResult }: UseOrgSearchOptions): SearchState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<Omit<SearchState, 'submit'>>(IDLE);

  const submit = useCallback(
    (query: string) => {
      const trimmed = query.trim();

      if (!trimmed) {
        onResult({});
        setState(IDLE);
        return;
      }

      setState({ isRunning: true, source: null, reason: null });

      queryClient
        .fetchQuery({
          // Repeating the same phrase costs nothing.
          queryKey: ['search', trimmed] as const,
          queryFn: ({ signal }) => searchOrg(trimmed, signal),
          staleTime: SEARCH_CACHE_MS,
        })
        .then((response) => {
          onResult(response.filter, response.sort);
          setState({
            isRunning: false,
            source: response.source,
            reason: response.reason ?? null,
          });
        })
        .catch(() => {
          // Even an unreachable endpoint must leave the user with a working search.
          onResult({ name: trimmed });
          setState({ isRunning: false, source: 'text', reason: 'failed' });
        });
    },
    [queryClient, onResult],
  );

  return { ...state, submit };
}
