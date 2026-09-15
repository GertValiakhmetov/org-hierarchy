import { describe, expect, it } from 'vitest';
import type { OrgNodeDto } from '@shared/types';
import { ApiError } from '@/shared/transport/errors';
import { parseOrgTreeResponse } from './org-tree.schema';

function node(overrides: Partial<OrgNodeDto> & Pick<OrgNodeDto, 'id'>): OrgNodeDto {
  return {
    name: `Узел ${overrides.id}`,
    parentId: null,
    headcount: 5,
    budget: 1_000_000,
    performance: 70,
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

function issuePathsOf(payload: unknown): string[] {
  try {
    parseOrgTreeResponse(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.issues.map((issue) => issue.path);
    }
  }
  return [];
}

describe('parseOrgTreeResponse', () => {
  it('returns a valid payload untouched', () => {
    const payload = [node({ id: 'a' }), node({ id: 'b', parentId: 'a' })];
    expect(parseOrgTreeResponse(payload)).toBe(payload);
  });

  it('accepts an empty array: no data is not a schema violation', () => {
    expect(parseOrgTreeResponse([])).toEqual([]);
  });

  it('rejects a payload that is not an array', () => {
    expect(issuePathsOf({ nodes: [] })).toEqual(['$']);
  });

  it('reports every missing or invalid field, not just the first', () => {
    const paths = issuePathsOf([{ id: 'a', name: 'A', parentId: null }]);
    expect(paths).toEqual(['[0].headcount', '[0].budget', '[0].performance', '[0].updatedAt']);
  });

  it('requires performance within 0-100', () => {
    expect(issuePathsOf([node({ id: 'a', performance: 140 })])).toEqual(['[0].performance']);
  });

  it('requires headcount to be a non-negative integer', () => {
    expect(issuePathsOf([node({ id: 'a', headcount: 2.5 })])).toEqual(['[0].headcount']);
    expect(issuePathsOf([node({ id: 'a', headcount: -1 })])).toEqual(['[0].headcount']);
  });

  it('requires updatedAt to be an ISO-8601 date', () => {
    expect(issuePathsOf([node({ id: 'a', updatedAt: 'вчера' })])).toEqual(['[0].updatedAt']);
  });

  it('detects duplicate ids', () => {
    expect(issuePathsOf([node({ id: 'a' }), node({ id: 'a' })])).toEqual(['[1].id']);
  });

  it('detects a parentId with no matching node', () => {
    expect(issuePathsOf([node({ id: 'a', parentId: 'ghost' })])).toEqual(['[0].parentId']);
  });

  it('detects a cycle and reports it once, not per member', () => {
    const payload = [node({ id: 'a', parentId: 'b' }), node({ id: 'b', parentId: 'a' })];
    expect(issuePathsOf(payload)).toEqual(['[0].parentId']);
  });
});
