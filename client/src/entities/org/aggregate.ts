import type { OrgTree } from './types';

export interface OrgAggregate {
  headcount: number;
  budget: number;
  /** Weighted by headcount, so a large team moves it more than a small one. */
  performance: number;
}

export type OrgAggregates = ReadonlyMap<string, OrgAggregate>;

interface Accumulator {
  headcount: number;
  budget: number;
  /** Σ(performance × headcount); kept to fold children into a parent. */
  weighted: number;
  /** Σ(performance) and the node count behind it, used when all weights are 0. */
  performanceSum: number;
  nodeCount: number;
}

/**
 * Rolls every node's own metrics up through its subtree in one O(n) pass.
 *
 * `tree.order` is depth-first, so walking it backwards guarantees that every
 * child is finished before its parent is reached — no recursion, no repeated
 * traversal, and the whole tree is aggregated exactly once.
 */
export function aggregateTree(tree: OrgTree): OrgAggregates {
  // Bookkeeping stays in `accumulators`; `result` carries only the public shape,
  // so intermediate sums cannot leak to consumers at runtime.
  const accumulators = new Map<string, Accumulator>();
  const result = new Map<string, OrgAggregate>();

  for (let index = tree.order.length - 1; index >= 0; index -= 1) {
    const id = tree.order[index];
    const node = id === undefined ? undefined : tree.byId.get(id);
    if (!node) continue;

    const total: Accumulator = {
      headcount: node.headcount,
      budget: node.budget,
      weighted: node.performance * node.headcount,
      performanceSum: node.performance,
      nodeCount: 1,
    };

    for (const child of node.children) {
      const childTotal = accumulators.get(child.id);
      if (!childTotal) continue;

      total.headcount += childTotal.headcount;
      total.budget += childTotal.budget;
      total.weighted += childTotal.weighted;
      total.performanceSum += childTotal.performanceSum;
      total.nodeCount += childTotal.nodeCount;
    }

    accumulators.set(node.id, total);

    // A weighted mean is undefined when every weight is zero, so a subtree with
    // no staff falls back to the plain mean of its nodes' own scores.
    result.set(node.id, {
      headcount: total.headcount,
      budget: total.budget,
      performance:
        total.headcount > 0
          ? total.weighted / total.headcount
          : total.performanceSum / total.nodeCount,
    });
  }

  return result;
}
