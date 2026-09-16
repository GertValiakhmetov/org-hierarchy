import type { OrgNode, OrgTree } from './types';

export interface OrgAggregate {
  headcount: number;
  budget: number;
  /** Weighted by headcount, so a large team moves it more than a small one. */
  performance: number;
}

interface Accumulator {
  headcount: number;
  budget: number;
  /** Σ(performance × headcount), kept so a parent can fold its children. */
  weighted: number;
  /** Used only when the whole subtree has zero headcount. */
  performanceSum: number;
  nodeCount: number;
}

function accumulate(node: OrgNode, totals: Map<string, Accumulator>): Accumulator {
  const total: Accumulator = {
    headcount: node.headcount,
    budget: node.budget,
    weighted: node.performance * node.headcount,
    performanceSum: node.performance,
    nodeCount: 1,
  };

  for (const child of node.children) {
    const childTotal = totals.get(child.id);
    if (!childTotal) continue;

    total.headcount += childTotal.headcount;
    total.budget += childTotal.budget;
    total.weighted += childTotal.weighted;
    total.performanceSum += childTotal.performanceSum;
    total.nodeCount += childTotal.nodeCount;
  }

  return total;
}

function publish(total: Accumulator): OrgAggregate {
  return {
    headcount: total.headcount,
    budget: total.budget,
    // A weighted mean is undefined when every weight is zero, so a subtree with
    // no staff falls back to the plain mean of its nodes' own scores.
    performance:
      total.headcount > 0 ? total.weighted / total.headcount : total.performanceSum / total.nodeCount,
  };
}

/**
 * Holds the published values alongside the running sums a parent needs, so a
 * single branch can be recomputed later without revisiting the whole tree.
 */
export class OrgAggregates {
  private constructor(
    private readonly totals: Map<string, Accumulator>,
    private readonly values: Map<string, OrgAggregate>,
  ) {}

  static empty(): OrgAggregates {
    return new OrgAggregates(new Map(), new Map());
  }

  get size(): number {
    return this.values.size;
  }

  get(nodeId: string): OrgAggregate | undefined {
    return this.values.get(nodeId);
  }

  /**
   * Rolls every node up in one O(n) pass. `tree.order` is depth-first, so
   * walking it backwards reaches every child before its parent.
   */
  static fromTree(tree: OrgTree): OrgAggregates {
    const totals = new Map<string, Accumulator>();
    const values = new Map<string, OrgAggregate>();

    for (let index = tree.order.length - 1; index >= 0; index -= 1) {
      const id = tree.order[index];
      const node = id === undefined ? undefined : tree.byId.get(id);
      if (!node) continue;

      const total = accumulate(node, totals);
      totals.set(node.id, total);
      values.set(node.id, publish(total));
    }

    return new OrgAggregates(totals, values);
  }

  /**
   * Recomputes the changed node and its ancestors only — O(depth) rather than
   * O(n). Everything else is carried over from this snapshot, and a fresh
   * instance is returned so consumers can compare by reference.
   */
  recomputeBranch(tree: OrgTree, changedNodeId: string): OrgAggregates {
    const totals = new Map(this.totals);
    const values = new Map(this.values);

    let node = tree.byId.get(changedNodeId);

    while (node) {
      const total = accumulate(node, totals);
      totals.set(node.id, total);
      values.set(node.id, publish(total));
      node = node.parentId === null ? undefined : tree.byId.get(node.parentId);
    }

    return new OrgAggregates(totals, values);
  }
}

export function aggregateTree(tree: OrgTree): OrgAggregates {
  return OrgAggregates.fromTree(tree);
}
