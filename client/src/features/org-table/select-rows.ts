import { COLUMN_BY_ID, type ColumnId, type Row, type SortDirection } from './columns';

export interface Sort {
  column: ColumnId;
  direction: SortDirection;
}

export function selectRows(rows: readonly Row[], filter: string, sort: Sort | null): readonly Row[] {
  const needle = filter.trim().toLocaleLowerCase('ru-RU');

  const filtered = needle
    ? rows.filter((row) => row.node.name.toLocaleLowerCase('ru-RU').includes(needle))
    : rows;

  if (!sort) return filtered;

  const { compare } = COLUMN_BY_ID[sort.column];
  const sign = sort.direction === 'asc' ? 1 : -1;

  // Copied before sorting: `filtered` may be the caller's own array, and sorting
  // in place would scramble the memoised source.
  return [...filtered].sort((a, b) => sign * compare(a, b));
}

export function nextSort(current: Sort | null, column: ColumnId): Sort {
  return current?.column === column
    ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { column, direction: COLUMN_BY_ID[column].initialDirection };
}
