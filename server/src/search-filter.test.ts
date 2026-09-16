import { describe, expect, it } from 'vitest';
import type { OrgNodeDto } from '../../shared/types.ts';
import { buildSystemPrompt, FilterSchema, toOrgFilter, type ParsedFilter } from './search-filter.ts';

/** The shape the model is forced to return: every key present, unused ones null. */
function parsed(overrides: Partial<ParsedFilter> = {}): ParsedFilter {
  return {
    name: null,
    ids: null,
    levels: null,
    headcount: null,
    budget: null,
    performance: null,
    sort: null,
    ...overrides,
  };
}

function node(id: string, parentId: string | null, name = id): OrgNodeDto {
  return {
    id,
    name,
    parentId,
    headcount: 1,
    budget: 1,
    performance: 50,
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
}

describe('toOrgFilter', () => {
  it('turns an all-null answer into an empty filter', () => {
    expect(toOrgFilter(parsed())).toEqual({ filter: {} });
  });

  it('keeps a name and trims it', () => {
    expect(toOrgFilter(parsed({ name: '  маркет  ' })).filter).toEqual({ name: 'маркет' });
  });

  it('drops a name that is only whitespace', () => {
    expect(toOrgFilter(parsed({ name: '   ' })).filter).toEqual({});
  });

  it('drops empty arrays rather than filtering on nothing', () => {
    expect(toOrgFilter(parsed({ ids: [], levels: [] })).filter).toEqual({});
  });

  it('keeps a non-empty selection', () => {
    expect(toOrgFilter(parsed({ ids: ['a', 'b'], levels: ['team'] })).filter).toEqual({
      ids: ['a', 'b'],
      levels: ['team'],
    });
  });

  it('keeps only the bound the model actually set', () => {
    expect(toOrgFilter(parsed({ headcount: { min: 30, max: null } })).filter).toEqual({
      headcount: { min: 30 },
    });
    expect(toOrgFilter(parsed({ performance: { min: null, max: 60 } })).filter).toEqual({
      performance: { max: 60 },
    });
  });

  it('drops a range whose bounds are both null', () => {
    expect(toOrgFilter(parsed({ budget: { min: null, max: null } })).filter).toEqual({});
  });

  it('keeps a zero bound, which is meaningful', () => {
    expect(toOrgFilter(parsed({ headcount: { min: 0, max: null } })).filter).toEqual({
      headcount: { min: 0 },
    });
  });

  it('returns sort separately from the filter', () => {
    const result = toOrgFilter(parsed({ sort: { column: 'budget', direction: 'desc' } }));

    expect(result.filter).toEqual({});
    expect(result.sort).toEqual({ column: 'budget', direction: 'desc' });
  });

  it('omits sort entirely when the model set none', () => {
    expect(toOrgFilter(parsed())).not.toHaveProperty('sort');
  });

  it('combines every condition at once', () => {
    const result = toOrgFilter(
      parsed({
        levels: ['department'],
        headcount: { min: 30, max: null },
        performance: { min: null, max: 64 },
        sort: { column: 'headcount', direction: 'asc' },
      }),
    );

    expect(result).toEqual({
      filter: { levels: ['department'], headcount: { min: 30 }, performance: { max: 64 } },
      sort: { column: 'headcount', direction: 'asc' },
    });
  });
});

describe('buildSystemPrompt', () => {
  const NODES = [
    node('div', null, 'Инженерия'),
    node('dep', 'div', 'Платформа'),
    node('team', 'dep', 'Ядро'),
  ];

  it('labels a root as a division, a parent as a department and a leaf as a team', () => {
    const prompt = buildSystemPrompt(NODES);

    expect(prompt).toContain('div|Инженерия|division');
    expect(prompt).toContain('dep|Платформа|department');
    expect(prompt).toContain('team|Ядро|team');
  });

  it('lists every node exactly once', () => {
    // The header line carries pipes too, so count only what follows it.
    const [, list = ''] = buildSystemPrompt(NODES).split('(id|название|уровень):\n');

    expect(list.trim().split('\n')).toHaveLength(NODES.length);
  });

  it('carries no metrics — the model never sees headcount or budget', () => {
    const prompt = buildSystemPrompt([
      { ...node('a', null, 'Отдел'), headcount: 4242, budget: 7777777, performance: 13 },
    ]);

    expect(prompt).not.toContain('4242');
    expect(prompt).not.toContain('7777777');
    expect(prompt).not.toContain('13');
  });
});

describe('FilterSchema', () => {
  it('accepts the all-null answer', () => {
    expect(FilterSchema.safeParse(parsed()).success).toBe(true);
  });

  it('requires every key to be present, not merely optional', () => {
    expect(FilterSchema.safeParse({ name: 'а' }).success).toBe(false);
  });

  it('rejects a level outside the hierarchy', () => {
    expect(FilterSchema.safeParse(parsed({ levels: ['galaxy'] as never })).success).toBe(false);
  });

  it('rejects a sort column the table does not have', () => {
    const bad = parsed({ sort: { column: 'salary', direction: 'asc' } as never });

    expect(FilterSchema.safeParse(bad).success).toBe(false);
  });
});
