import { describe, expect, it } from 'vitest';
import type { OrgNodeDto } from '@shared/types';
import { ancestorIds, buildTree } from './build-tree';

function node(id: string, parentId: string | null): OrgNodeDto {
  return {
    id,
    name: id.toUpperCase(),
    parentId,
    headcount: 1,
    budget: 1,
    performance: 50,
    updatedAt: '2026-09-01T10:00:00.000Z',
  };
}

const FLAT: OrgNodeDto[] = [
  node('div', null),
  node('dep-1', 'div'),
  node('team-1', 'dep-1'),
  node('team-2', 'dep-1'),
  node('dep-2', 'div'),
];

describe('buildTree', () => {
  it('assembles the hierarchy from a flat list', () => {
    const tree = buildTree(FLAT);

    expect(tree.roots.map((root) => root.id)).toEqual(['div']);
    expect(tree.size).toBe(5);
    expect(tree.byId.get('dep-1')?.children.map((child) => child.id)).toEqual(['team-1', 'team-2']);
    expect(tree.byId.get('team-1')?.children).toEqual([]);
  });

  it('assigns depth and level', () => {
    const tree = buildTree(FLAT);

    expect(tree.byId.get('div')).toMatchObject({ depth: 0, level: 'division' });
    expect(tree.byId.get('dep-1')).toMatchObject({ depth: 1, level: 'department' });
    expect(tree.byId.get('team-1')).toMatchObject({ depth: 2, level: 'team' });
  });

  it('links nodes that appear before their parent', () => {
    const childrenFirst = [FLAT[2]!, FLAT[3]!, FLAT[1]!, FLAT[4]!, FLAT[0]!];
    const tree = buildTree(childrenFirst);

    expect(tree.roots.map((root) => root.id)).toEqual(['div']);
    expect(tree.byId.get('team-1')?.depth).toBe(2);
    expect(tree.byId.get('dep-1')?.children.map((child) => child.id)).toEqual(['team-1', 'team-2']);
  });

  it('sibling order is inherited from the server response', () => {
    const reversedSiblings = [FLAT[0]!, FLAT[4]!, FLAT[1]!, FLAT[2]!, FLAT[3]!];

    expect(buildTree(reversedSiblings).order).toEqual(['div', 'dep-2', 'dep-1', 'team-1', 'team-2']);
  });

  it('supports several roots', () => {
    const tree = buildTree([node('a', null), node('b', null), node('a-1', 'a')]);

    expect(tree.roots.map((root) => root.id)).toEqual(['a', 'b']);
    expect(tree.byId.get('a-1')?.depth).toBe(1);
  });

  it('returns an empty tree for an empty list', () => {
    expect(buildTree([])).toMatchObject({ roots: [], size: 0, order: [] });
  });
});

describe('ancestorIds', () => {
  it('returns ancestors ordered nearest-first', () => {
    expect(ancestorIds(buildTree(FLAT), 'team-1')).toEqual(['dep-1', 'div']);
  });

  it('a root has no ancestors', () => {
    expect(ancestorIds(buildTree(FLAT), 'div')).toEqual([]);
  });
});
