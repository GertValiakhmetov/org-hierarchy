import { describe, expect, it } from 'vitest';
import type { OrgAggregate } from '@/entities/org/aggregate';
import type { OrgNode } from '@/entities/org/types';
import type { Row } from './columns';
import { nextSort, selectRows, type Sort } from './select-rows';

function row(
  name: string,
  level: OrgNode['level'],
  aggregate: Partial<OrgAggregate> = {},
): Row {
  return {
    node: { name, level, id: name } as OrgNode,
    aggregate: {
      headcount: aggregate.headcount ?? 0,
      budget: aggregate.budget ?? 0,
      performance: aggregate.performance ?? 0,
    },
  };
}

const ROWS: Row[] = [
  row('Инженерия', 'division', { headcount: 108, budget: 103_378_000, performance: 71.6 }),
  row('Маркетинг', 'department', { headcount: 32, budget: 18_000_000, performance: 54.8 }),
  row('API', 'team', { headcount: 13, budget: 4_931_000, performance: 97 }),
];

const names = (rows: readonly Row[]) => rows.map((r) => r.node.name);

describe('selectRows', () => {
  it('keeps the original order when no sort is set', () => {
    expect(names(selectRows(ROWS, '', null))).toEqual(['Инженерия', 'Маркетинг', 'API']);
  });

  it('sorts numerically by an aggregate column', () => {
    const sort: Sort = { column: 'headcount', direction: 'desc' };

    expect(names(selectRows(ROWS, '', sort))).toEqual(['Инженерия', 'Маркетинг', 'API']);
    expect(names(selectRows(ROWS, '', { ...sort, direction: 'asc' }))).toEqual([
      'API',
      'Маркетинг',
      'Инженерия',
    ]);
  });

  it('sorts names with a Russian collator, not by code point', () => {
    const cyrillic = [row('ёлка', 'team'), row('его', 'team'), row('яблоко', 'team')];

    expect(names(selectRows(cyrillic, '', { column: 'name', direction: 'asc' }))).toEqual([
      'его',
      'ёлка',
      'яблоко',
    ]);
  });

  it('sorts levels by hierarchy rather than alphabetically', () => {
    const sorted = selectRows(ROWS, '', { column: 'level', direction: 'asc' });

    expect(sorted.map((r) => r.node.level)).toEqual(['division', 'department', 'team']);
  });

  it('filters by substring, ignoring case', () => {
    expect(names(selectRows(ROWS, 'МАРК', null))).toEqual(['Маркетинг']);
    expect(names(selectRows(ROWS, 'api', null))).toEqual(['API']);
  });

  it('ignores surrounding whitespace in the filter', () => {
    expect(names(selectRows(ROWS, '  Маркетинг  ', null))).toEqual(['Маркетинг']);
  });

  it('returns nothing when the filter matches no name', () => {
    expect(selectRows(ROWS, 'отсутствует', null)).toEqual([]);
  });

  it('applies the filter before sorting', () => {
    const result = selectRows(ROWS, 'и', { column: 'headcount', direction: 'asc' });

    expect(names(result)).toEqual(['Маркетинг', 'Инженерия']);
  });

  it('does not mutate the array it was given', () => {
    const original = [...ROWS];
    selectRows(ROWS, '', { column: 'performance', direction: 'desc' });

    expect(ROWS).toEqual(original);
  });
});

describe('nextSort', () => {
  it('uses the column default on the first click', () => {
    expect(nextSort(null, 'headcount')).toEqual({ column: 'headcount', direction: 'desc' });
    expect(nextSort(null, 'name')).toEqual({ column: 'name', direction: 'asc' });
  });

  it('reverses direction on a repeat click', () => {
    const first = nextSort(null, 'budget');

    expect(nextSort(first, 'budget')).toEqual({ column: 'budget', direction: 'asc' });
  });

  it('switching column starts from that column default, not the previous direction', () => {
    const ascending: Sort = { column: 'name', direction: 'asc' };

    expect(nextSort(ascending, 'budget')).toEqual({ column: 'budget', direction: 'desc' });
  });
});
