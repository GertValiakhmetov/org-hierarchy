import { describe, expect, it } from 'vitest';
import type { OrgNodeDto } from '@shared/types';
import { aggregateTree } from './aggregate';
import { buildTree } from './build-tree';

function node(
  id: string,
  parentId: string | null,
  metrics: Partial<Pick<OrgNodeDto, 'headcount' | 'budget' | 'performance'>> = {},
): OrgNodeDto {
  return {
    id,
    name: id,
    parentId,
    headcount: metrics.headcount ?? 0,
    budget: metrics.budget ?? 0,
    performance: metrics.performance ?? 0,
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
}

const aggregatesOf = (nodes: OrgNodeDto[]) => aggregateTree(buildTree(nodes));

describe('aggregateTree', () => {
  it('returns a leaf its own metrics unchanged', () => {
    const result = aggregatesOf([node('team', null, { headcount: 10, budget: 500, performance: 80 })]);

    expect(result.get('team')).toEqual({ headcount: 10, budget: 500, performance: 80 });
  });

  it('sums headcount and budget of a node and all its descendants', () => {
    const result = aggregatesOf([
      node('div', null, { headcount: 5, budget: 1_000 }),
      node('dep', 'div', { headcount: 2, budget: 500 }),
      node('team-1', 'dep', { headcount: 10, budget: 300 }),
      node('team-2', 'dep', { headcount: 8, budget: 200 }),
    ]);

    expect(result.get('dep')).toMatchObject({ headcount: 20, budget: 1_000 });
    expect(result.get('div')).toMatchObject({ headcount: 25, budget: 2_000 });
  });

  it('weights performance by headcount rather than averaging plainly', () => {
    // 90×10 + 50×90 = 5400 over 100 people = 54; a plain mean would give 70.
    const result = aggregatesOf([
      node('dep', 'div', { headcount: 10, performance: 90 }),
      node('div', null, { headcount: 0, performance: 0 }),
      node('team', 'dep', { headcount: 90, performance: 50 }),
    ]);

    expect(result.get('dep')?.performance).toBe(54);
  });

  it('a zero-headcount node does not skew its parent average', () => {
    const result = aggregatesOf([
      node('dep', null, { headcount: 0, performance: 0 }),
      node('team', 'dep', { headcount: 10, performance: 75 }),
    ]);

    expect(result.get('dep')?.performance).toBe(75);
  });

  it('falls back to a plain mean when the whole subtree has no staff', () => {
    const result = aggregatesOf([
      node('dep', null, { headcount: 0, performance: 60 }),
      node('team-1', 'dep', { headcount: 0, performance: 90 }),
      node('team-2', 'dep', { headcount: 0, performance: 30 }),
    ]);

    expect(result.get('dep')?.performance).toBe(60);
  });

  it('keeps the weighting correct across three levels', () => {
    const result = aggregatesOf([
      node('div', null, { headcount: 2, performance: 100 }),
      node('dep-a', 'div', { headcount: 0, performance: 0 }),
      node('team-a', 'dep-a', { headcount: 8, performance: 50 }),
      node('dep-b', 'div', { headcount: 10, performance: 60 }),
    ]);

    // 100×2 + 50×8 + 60×10 = 1200 over 20 people.
    expect(result.get('div')).toMatchObject({ headcount: 20, performance: 60 });
  });

  it('covers every node of the tree', () => {
    const nodes = [
      node('div', null),
      node('dep', 'div'),
      node('team', 'dep'),
    ];

    expect(aggregatesOf(nodes).size).toBe(3);
  });

  it('supports several roots independently', () => {
    const result = aggregatesOf([
      node('a', null, { headcount: 1, budget: 10 }),
      node('b', null, { headcount: 2, budget: 20 }),
      node('a-1', 'a', { headcount: 3, budget: 30 }),
    ]);

    expect(result.get('a')).toMatchObject({ headcount: 4, budget: 40 });
    expect(result.get('b')).toMatchObject({ headcount: 2, budget: 20 });
  });

  it('returns nothing for an empty tree', () => {
    expect(aggregatesOf([]).size).toBe(0);
  });
});

describe('recomputeBranch', () => {
  const FLAT: OrgNodeDto[] = [
    node('div', null, { headcount: 2, budget: 100, performance: 60 }),
    node('dep', 'div', { headcount: 3, budget: 200, performance: 70 }),
    node('team-a', 'dep', { headcount: 5, budget: 300, performance: 80 }),
    node('team-b', 'dep', { headcount: 10, budget: 400, performance: 50 }),
    node('other', 'div', { headcount: 4, budget: 500, performance: 90 }),
  ];

  /** Applies a patch the way the query cache does, then rebuilds the tree. */
  function patched(changes: Partial<OrgNodeDto> & Pick<OrgNodeDto, 'id'>) {
    return buildTree(FLAT.map((n) => (n.id === changes.id ? { ...n, ...changes } : n)));
  }

  it('matches a full recomputation', () => {
    const before = aggregateTree(buildTree(FLAT));
    const tree = patched({ id: 'team-a', headcount: 25 });

    const incremental = before.recomputeBranch(tree, 'team-a');
    const full = aggregateTree(tree);

    for (const id of tree.order) {
      expect(incremental.get(id), id).toEqual(full.get(id));
    }
  });

  it('updates the changed node and every ancestor', () => {
    const tree = patched({ id: 'team-a', headcount: 25 });
    const next = aggregateTree(buildTree(FLAT)).recomputeBranch(tree, 'team-a');

    expect(next.get('team-a')?.headcount).toBe(25);
    expect(next.get('dep')?.headcount).toBe(38);
    expect(next.get('div')?.headcount).toBe(44);
  });

  it('leaves untouched branches byte-identical', () => {
    const before = aggregateTree(buildTree(FLAT));
    const tree = patched({ id: 'team-a', performance: 10 });
    const after = before.recomputeBranch(tree, 'team-a');

    expect(after.get('other')).toBe(before.get('other'));
    expect(after.get('team-b')).toBe(before.get('team-b'));
  });

  it('returns a new instance so consumers can compare by reference', () => {
    const before = aggregateTree(buildTree(FLAT));
    const after = before.recomputeBranch(patched({ id: 'team-a', budget: 1 }), 'team-a');

    expect(after).not.toBe(before);
    expect(before.get('div')?.budget).toBe(1_500);
  });

  it('propagates a weighted performance change up the chain', () => {
    const tree = patched({ id: 'team-b', performance: 100 });
    const next = aggregateTree(buildTree(FLAT)).recomputeBranch(tree, 'team-b');

    // dep: 70×3 + 80×5 + 100×10 = 1610 over 18 people.
    expect(next.get('dep')?.performance).toBeCloseTo(1_610 / 18, 10);
  });

  it('handles a patch on a root', () => {
    const tree = patched({ id: 'div', budget: 999 });
    const next = aggregateTree(buildTree(FLAT)).recomputeBranch(tree, 'div');

    expect(next.get('div')?.budget).toBe(2_399);
  });

  it('ignores a patch for an unknown node', () => {
    const before = aggregateTree(buildTree(FLAT));
    const after = before.recomputeBranch(buildTree(FLAT), 'ghost');

    expect(after.get('div')).toEqual(before.get('div'));
  });
});
