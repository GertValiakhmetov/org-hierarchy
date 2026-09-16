import { useCallback, useMemo, useState } from 'react';
import type { OrgAggregates } from '@/entities/org/aggregate';
import type { OrgTree } from '@/entities/org/types';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import type { ColumnId, Row } from './columns';
import { nextSort, selectRows, type Sort } from './select-rows';

const FILTER_DEBOUNCE_MS = 250;

export interface TableState {
  rows: readonly Row[];
  sort: Sort | null;
  filter: string;
  setFilter: (value: string) => void;
  toggleSort: (column: ColumnId) => void;
  totalCount: number;
}

export function useTableRows(tree: OrgTree | undefined, aggregates: OrgAggregates): TableState {
  const [sort, setSort] = useState<Sort | null>(null);
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebouncedValue(filter, FILTER_DEBOUNCE_MS);

  const allRows = useMemo<Row[]>(() => {
    if (!tree) return [];

    return tree.order.flatMap((id) => {
      const node = tree.byId.get(id);
      const aggregate = aggregates.get(id);
      return node && aggregate ? [{ node, aggregate }] : [];
    });
  }, [tree, aggregates]);

  const rows = useMemo(
    () => selectRows(allRows, debouncedFilter, sort),
    [allRows, debouncedFilter, sort],
  );

  const toggleSort = useCallback((column: ColumnId) => {
    setSort((previous) => nextSort(previous, column));
  }, []);

  return { rows, sort, filter, setFilter, toggleSort, totalCount: allRows.length };
}
