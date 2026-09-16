import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrgFilter } from '@shared/types';
import type { OrgAggregates } from '@/entities/org/aggregate';
import type { OrgTree } from '@/entities/org/types';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import type { ColumnId, Row } from './columns';
import { EMPTY_FILTER, nextSort, selectRows, type Sort } from './select-rows';

const FILTER_DEBOUNCE_MS = 250;

export interface TableState {
  rows: readonly Row[];
  sort: Sort | null;
  /** Raw input value — bound to the field so typing never lags. */
  query: string;
  setQuery: (value: string) => void;
  /** What is actually applied; richer than the text once a search returns one. */
  filter: OrgFilter;
  setFilter: (filter: OrgFilter) => void;
  clearFilter: () => void;
  /** Applies the typed text at once, skipping the debounce. */
  submitQuery: () => void;
  toggleSort: (column: ColumnId) => void;
  setSort: (sort: Sort | null) => void;
  totalCount: number;
}

export function useTableRows(tree: OrgTree | undefined, aggregates: OrgAggregates): TableState {
  const [sort, setSort] = useState<Sort | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrgFilter>(EMPTY_FILTER);
  const debouncedQuery = useDebouncedValue(query, FILTER_DEBOUNCE_MS);

  /**
   * Typing always returns to a plain name search, replacing whatever a search
   * produced. The effect keys off the debounced value, so a filter set after the
   * last keystroke survives — editing the text is what discards it.
   */
  useEffect(() => {
    setFilter(debouncedQuery.trim() ? { name: debouncedQuery } : EMPTY_FILTER);
  }, [debouncedQuery]);

  const allRows = useMemo<Row[]>(() => {
    if (!tree) return [];

    return tree.order.flatMap((id) => {
      const node = tree.byId.get(id);
      const aggregate = aggregates.get(id);
      return node && aggregate ? [{ node, aggregate }] : [];
    });
  }, [tree, aggregates]);

  const rows = useMemo(() => selectRows(allRows, filter, sort), [allRows, filter, sort]);

  const toggleSort = useCallback((column: ColumnId) => {
    setSort((previous) => nextSort(previous, column));
  }, []);

  const submitQuery = useCallback(() => {
    setFilter(query.trim() ? { name: query } : EMPTY_FILTER);
  }, [query]);

  const clearFilter = useCallback(() => {
    setQuery('');
    setFilter(EMPTY_FILTER);
  }, []);

  return {
    rows,
    sort,
    query,
    setQuery,
    filter,
    setFilter,
    submitQuery,
    clearFilter,
    toggleSort,
    setSort,
    totalCount: allRows.length,
  };
}
