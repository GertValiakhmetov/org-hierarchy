import { describe, expect, it } from 'vitest';
import type { OrgAggregate } from '@/entities/org/aggregate';
import type { OrgNode } from '@/entities/org/types';
import type { Row } from './columns';
import type { OrgFilter } from '@shared/types';
import { EMPTY_FILTER, isEmptyFilter, nextSort, selectRows, type Sort } from './select-rows';

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
    expect(names(selectRows(ROWS, EMPTY_FILTER, null))).toEqual(['Инженерия', 'Маркетинг', 'API']);
  });

  it('sorts numerically by an aggregate column', () => {
    const sort: Sort = { column: 'headcount', direction: 'desc' };

    expect(names(selectRows(ROWS, EMPTY_FILTER, sort))).toEqual(['Инженерия', 'Маркетинг', 'API']);
    expect(names(selectRows(ROWS, EMPTY_FILTER, { ...sort, direction: 'asc' }))).toEqual([
      'API',
      'Маркетинг',
      'Инженерия',
    ]);
  });

  it('sorts names with a Russian collator, not by code point', () => {
    const cyrillic = [row('ёлка', 'team'), row('его', 'team'), row('яблоко', 'team')];

    expect(names(selectRows(cyrillic, EMPTY_FILTER, { column: 'name', direction: 'asc' }))).toEqual([
      'его',
      'ёлка',
      'яблоко',
    ]);
  });

  it('sorts levels by hierarchy rather than alphabetically', () => {
    const sorted = selectRows(ROWS, EMPTY_FILTER, { column: 'level', direction: 'asc' });

    expect(sorted.map((r) => r.node.level)).toEqual(['division', 'department', 'team']);
  });

  it('filters by substring, ignoring case', () => {
    expect(names(selectRows(ROWS, { name: 'МАРК' }, null))).toEqual(['Маркетинг']);
    expect(names(selectRows(ROWS, { name: 'api' }, null))).toEqual(['API']);
  });

  it('ignores surrounding whitespace in the filter', () => {
    expect(names(selectRows(ROWS, { name: '  Маркетинг  ' }, null))).toEqual(['Маркетинг']);
  });

  it('returns nothing when the filter matches no name', () => {
    expect(selectRows(ROWS, { name: 'отсутствует' }, null)).toEqual([]);
  });

  it('applies the filter before sorting', () => {
    const result = selectRows(ROWS, { name: 'и' }, { column: 'headcount', direction: 'asc' });

    expect(names(result)).toEqual(['Маркетинг', 'Инженерия']);
  });

  it('does not mutate the array it was given', () => {
    const original = [...ROWS];
    selectRows(ROWS, EMPTY_FILTER, { column: 'performance', direction: 'desc' });

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

describe('selectRows: структурный фильтр', () => {
  const noSort = null;
  const names = (filter: OrgFilter) => selectRows(ROWS, filter, noSort).map((r) => r.node.name);

  it('an empty filter matches everything', () => {
    expect(names(EMPTY_FILTER)).toHaveLength(ROWS.length);
    expect(names({ name: undefined, levels: undefined })).toHaveLength(ROWS.length);
  });

  it('filters by level', () => {
    expect(names({ levels: ['department'] })).toEqual(['Маркетинг']);
    expect(names({ levels: ['division', 'team'] })).toEqual(['Инженерия', 'API']);
  });

  it('filters by an explicit id selection', () => {
    expect(names({ ids: ['API', 'Инженерия'] })).toEqual(['Инженерия', 'API']);
  });

  it('an empty id list matches nothing', () => {
    expect(names({ ids: [] })).toEqual([]);
  });

  it('filters by a lower bound on headcount', () => {
    expect(names({ headcount: { min: 30 } })).toEqual(['Инженерия', 'Маркетинг']);
  });

  it('filters by an upper bound on performance', () => {
    expect(names({ performance: { max: 60 } })).toEqual(['Маркетинг']);
  });

  it('treats a range as inclusive on both ends', () => {
    expect(names({ headcount: { min: 32, max: 32 } })).toEqual(['Маркетинг']);
  });

  it('filters by budget range', () => {
    expect(names({ budget: { min: 10_000_000 } })).toEqual(['Инженерия', 'Маркетинг']);
  });

  it('combines conditions with AND', () => {
    expect(names({ levels: ['division', 'department'], performance: { max: 60 } })).toEqual([
      'Маркетинг',
    ]);
    expect(names({ levels: ['team'], headcount: { min: 100 } })).toEqual([]);
  });

  it('compares ranges against aggregates, which is what the table shows', () => {
    // «Инженерия» имеет 108 в свёртке; собственное значение узла меньше.
    expect(names({ headcount: { min: 100 } })).toEqual(['Инженерия']);
  });

  it('still sorts what the filter left', () => {
    const result = selectRows(ROWS, { levels: ['division', 'department'] }, {
      column: 'headcount',
      direction: 'asc',
    });

    expect(result.map((r) => r.node.name)).toEqual(['Маркетинг', 'Инженерия']);
  });
});

describe('isEmptyFilter', () => {
  it('is true for a filter with nothing set', () => {
    expect(isEmptyFilter({})).toBe(true);
    expect(isEmptyFilter({ name: undefined })).toBe(true);
  });

  it('is false as soon as one condition is present', () => {
    expect(isEmptyFilter({ levels: [] })).toBe(false);
    expect(isEmptyFilter({ name: '' })).toBe(false);
  });
});
