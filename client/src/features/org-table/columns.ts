import type { SortColumn } from '@shared/types';
import type { OrgAggregate } from '@/entities/org/aggregate';
import type { OrgNode } from '@/entities/org/types';

export type ColumnId = SortColumn;

export type SortDirection = 'asc' | 'desc';

export interface ColumnSpec {
  id: ColumnId;
  title: string;
  numeric: boolean;
  /**
   * Direction applied on the first click. Numbers read best largest-first,
   * text alphabetically, so the useful order comes without a second click.
   */
  initialDirection: SortDirection;
  compare: (a: Row, b: Row) => number;
}

export interface Row {
  node: OrgNode;
  aggregate: OrgAggregate;
}

const collator = new Intl.Collator('ru-RU');

const LEVEL_RANK: Record<OrgNode['level'], number> = { division: 0, department: 1, team: 2 };

export const COLUMNS: readonly ColumnSpec[] = [
  {
    id: 'name',
    title: 'Подразделение',
    numeric: false,
    initialDirection: 'asc',
    compare: (a, b) => collator.compare(a.node.name, b.node.name),
  },
  {
    id: 'level',
    title: 'Уровень',
    numeric: false,
    initialDirection: 'asc',
    compare: (a, b) => LEVEL_RANK[a.node.level] - LEVEL_RANK[b.node.level],
  },
  {
    id: 'headcount',
    title: 'Всего сотрудников',
    numeric: true,
    initialDirection: 'desc',
    compare: (a, b) => a.aggregate.headcount - b.aggregate.headcount,
  },
  {
    id: 'budget',
    title: 'Бюджет суммарный',
    numeric: true,
    initialDirection: 'desc',
    compare: (a, b) => a.aggregate.budget - b.aggregate.budget,
  },
  {
    id: 'performance',
    title: 'Средняя эффективность',
    numeric: true,
    initialDirection: 'desc',
    compare: (a, b) => a.aggregate.performance - b.aggregate.performance,
  },
];

export const COLUMN_BY_ID: Record<ColumnId, ColumnSpec> = Object.fromEntries(
  COLUMNS.map((column) => [column.id, column]),
) as Record<ColumnId, ColumnSpec>;
