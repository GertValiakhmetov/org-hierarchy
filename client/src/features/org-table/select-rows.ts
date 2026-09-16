import type { NumericRange, OrgFilter } from '@shared/types';
import { COLUMN_BY_ID, type ColumnId, type Row, type SortDirection } from './columns';

export interface Sort {
  column: ColumnId;
  direction: SortDirection;
}

export const EMPTY_FILTER: OrgFilter = {};

function inRange(value: number, range: NumericRange | undefined): boolean {
  if (!range) return true;
  if (range.min !== undefined && value < range.min) return false;
  return !(range.max !== undefined && value > range.max);
}

function matches(row: Row, filter: OrgFilter, ids: ReadonlySet<string> | null): boolean {
  if (ids && !ids.has(row.node.id)) return false;
  if (filter.levels && !filter.levels.includes(row.node.level)) return false;

  if (filter.name) {
    const needle = filter.name.trim().toLocaleLowerCase('ru-RU');
    if (needle && !row.node.name.toLocaleLowerCase('ru-RU').includes(needle)) return false;
  }

  return (
    inRange(row.aggregate.headcount, filter.headcount) &&
    inRange(row.aggregate.budget, filter.budget) &&
    inRange(row.aggregate.performance, filter.performance)
  );
}

export function isEmptyFilter(filter: OrgFilter): boolean {
  return Object.values(filter).every((value) => value === undefined);
}

export function selectRows(
  rows: readonly Row[],
  filter: OrgFilter,
  sort: Sort | null,
): readonly Row[] {
  // Built once per call rather than per row: `ids` can hold the whole tree.
  const ids = filter.ids ? new Set(filter.ids) : null;

  const filtered = isEmptyFilter(filter) ? rows : rows.filter((row) => matches(row, filter, ids));

  if (!sort) return filtered;

  const { compare } = COLUMN_BY_ID[sort.column];
  const sign = sort.direction === 'asc' ? 1 : -1;

  // Copied before sorting: `filtered` may be the caller's own array, and sorting
  // in place would scramble the memoised source.
  return [...filtered].sort((a, b) => sign * compare(a, b));
}

/** First click sorts by a column, a repeat click reverses it. */
export function nextSort(current: Sort | null, column: ColumnId): Sort {
  return current?.column === column
    ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { column, direction: COLUMN_BY_ID[column].initialDirection };
}
