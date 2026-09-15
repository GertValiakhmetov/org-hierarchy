import type { OrgNodeDto } from '@shared/types';
import { levelFromDepth, type OrgNode, type OrgTree } from './types';

/**
 * Expands the flat response into a tree. The input is guaranteed valid by the
 * schema, so there are no defensive checks here.
 *
 * Sibling order is inherited from the server rather than sorted: the response
 * orders departments and teams meaningfully, and sorting would destroy that.
 */
export function buildTree(nodes: readonly OrgNodeDto[]): OrgTree {
  const byId = new Map<string, OrgNode>();

  for (const dto of nodes) {
    byId.set(dto.id, { ...dto, depth: 0, level: 'division', children: [] });
  }

  const roots: OrgNode[] = [];

  for (const dto of nodes) {
    const node = byId.get(dto.id);
    if (!node) continue;

    if (dto.parentId === null) {
      roots.push(node);
      continue;
    }

    byId.get(dto.parentId)?.children.push(node);
  }

  // Depth needs its own pass: in a flat array a parent may appear after its
  // child, so it cannot be resolved while the links are still being wired up.
  const order: string[] = [];
  const stack: OrgNode[] = [...roots].reverse();

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) break;

    node.level = levelFromDepth(node.depth);
    order.push(node.id);

    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      const child = node.children[index];
      if (!child) continue;
      child.depth = node.depth + 1;
      stack.push(child);
    }
  }

  return { roots, byId, order, size: byId.size };
}

/** Ancestors ordered nearest-first, up to the root. */
export function ancestorIds(tree: OrgTree, nodeId: string): string[] {
  const chain: string[] = [];
  let current = tree.byId.get(nodeId)?.parentId ?? null;

  while (current !== null) {
    chain.push(current);
    current = tree.byId.get(current)?.parentId ?? null;
  }

  return chain;
}
