import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/transport/errors';
import { parseSearchResponse } from './search.schema';

const ok = (payload: unknown) => parseSearchResponse(payload);
const issues = (payload: unknown): string[] => {
  try {
    parseSearchResponse(payload);
  } catch (error) {
    if (error instanceof ApiError) return error.issues.map((issue) => issue.path);
  }
  return [];
};

describe('parseSearchResponse', () => {
  it('accepts a plain text fallback', () => {
    expect(ok({ source: 'text', filter: { name: 'дизайн' }, reason: 'not-configured' })).toEqual({
      source: 'text',
      filter: { name: 'дизайн' },
      reason: 'not-configured',
    });
  });

  it('accepts a structured filter', () => {
    expect(
      ok({
        source: 'ai',
        filter: { levels: ['department'], headcount: { min: 30 }, performance: { max: 65 } },
      }),
    ).toEqual({
      source: 'ai',
      filter: { levels: ['department'], headcount: { min: 30 }, performance: { max: 65 } },
    });
  });

  it('rejects an unknown source', () => {
    expect(issues({ source: 'magic', filter: {} })).toEqual(['source']);
  });

  it('drops keys the filter does not define', () => {
    const result = ok({ source: 'ai', filter: { name: 'а', shellCommand: 'rm -rf /', limit: 5 } });

    expect(result.filter).toEqual({ name: 'а' });
  });

  it('rejects a performance range outside 0-100', () => {
    expect(issues({ source: 'ai', filter: { performance: { max: 400 } } })).toEqual([
      'filter.performance.max',
    ]);
  });

  it('rejects a negative headcount', () => {
    expect(issues({ source: 'ai', filter: { headcount: { min: -5 } } })).toEqual([
      'filter.headcount.min',
    ]);
  });

  it('rejects an inverted range', () => {
    expect(issues({ source: 'ai', filter: { budget: { min: 100, max: 10 } } })).toEqual([
      'filter.budget',
    ]);
  });

  it('rejects an unknown level', () => {
    expect(issues({ source: 'ai', filter: { levels: ['division', 'galaxy'] } })).toEqual([
      'filter.levels',
    ]);
  });

  it('rejects a sort on an unknown column', () => {
    expect(
      issues({ source: 'ai', filter: {}, sort: { column: 'salary', direction: 'asc' } }),
    ).toEqual(['sort.column']);
  });

  it('accepts a valid sort', () => {
    const result = ok({ source: 'ai', filter: {}, sort: { column: 'budget', direction: 'desc' } });

    expect(result.sort).toEqual({ column: 'budget', direction: 'desc' });
  });

  it('ignores a blank name rather than filtering on nothing', () => {
    expect(ok({ source: 'ai', filter: { name: '   ' } }).filter).toEqual({});
  });

  it('keeps an empty id list, which means "nothing matched"', () => {
    expect(ok({ source: 'ai', filter: { ids: [] } }).filter).toEqual({ ids: [] });
  });
});
