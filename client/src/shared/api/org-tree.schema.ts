import type { OrgNodeDto } from '@shared/types';
import { ApiError, type ValidationIssue } from '@/shared/transport/errors';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkNonEmptyString(value: unknown, path: string, issues: ValidationIssue[]): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({ path, message: 'ожидалась непустая строка' });
    return false;
  }
  return true;
}

function checkNumber(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: { min: number; max?: number; integer?: boolean },
): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, message: 'ожидалось конечное число' });
    return false;
  }
  if (options.integer && !Number.isInteger(value)) {
    issues.push({ path, message: 'ожидалось целое число' });
    return false;
  }
  if (value < options.min || (options.max !== undefined && value > options.max)) {
    const range = options.max === undefined ? `≥ ${options.min}` : `${options.min}–${options.max}`;
    issues.push({ path, message: `значение вне диапазона ${range}` });
    return false;
  }
  return true;
}

function checkNode(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'ожидался объект узла' });
    return;
  }

  checkNonEmptyString(value.id, `${path}.id`, issues);
  checkNonEmptyString(value.name, `${path}.name`, issues);

  if (value.parentId !== null) {
    checkNonEmptyString(value.parentId, `${path}.parentId`, issues);
  }

  checkNumber(value.headcount, `${path}.headcount`, issues, { min: 0, integer: true });
  checkNumber(value.budget, `${path}.budget`, issues, { min: 0 });
  checkNumber(value.performance, `${path}.performance`, issues, { min: 0, max: 100 });

  if (checkNonEmptyString(value.updatedAt, `${path}.updatedAt`, issues)) {
    if (Number.isNaN(Date.parse(value.updatedAt as string))) {
      issues.push({ path: `${path}.updatedAt`, message: 'ожидалась дата в формате ISO-8601' });
    }
  }
}

function checkGraph(nodes: OrgNodeDto[], issues: ValidationIssue[]): void {
  const byId = new Map<string, OrgNodeDto>();

  nodes.forEach((node, index) => {
    if (byId.has(node.id)) {
      issues.push({ path: `[${index}].id`, message: `повторяющийся id «${node.id}»` });
      return;
    }
    byId.set(node.id, node);
  });

  nodes.forEach((node, index) => {
    if (node.parentId !== null && !byId.has(node.parentId)) {
      issues.push({ path: `[${index}].parentId`, message: `родитель «${node.parentId}» отсутствует в ответе` });
    }
  });

  if (issues.length > 0) {
    // Walking upwards is meaningless while parent links are known to dangle.
    return;
  }

  // Marking nodes whose walk to a root already succeeded keeps the whole sweep
  // at O(n) instead of O(n · depth), and reports one issue per cycle rather than
  // one per member.
  const settled = new Set<string>();

  for (const [index, node] of nodes.entries()) {
    const path = new Set<string>();
    let current: OrgNodeDto | undefined = node;

    while (current && !settled.has(current.id)) {
      if (path.has(current.id)) {
        issues.push({ path: `[${index}].parentId`, message: `цикл в иерархии через «${current.id}»` });
        break;
      }
      path.add(current.id);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }

    for (const id of path) {
      settled.add(id);
    }
  }
}

/**
 * Validates both the shape of each node and the connectivity of the array.
 *
 * Duplicate ids, dangling `parentId` and cycles are treated as schema violations
 * rather than tree-building concerns: such a response is just as unusable as one
 * with a missing field, and the fault lies with the server either way. As a
 * result `buildTree` can assume a valid input and carry no defensive checks.
 */
export function parseOrgTreeResponse(payload: unknown): OrgNodeDto[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(payload)) {
    throw new ApiError('schema', 'Org-tree response does not match the schema', {
      issues: [{ path: '$', message: 'ожидался массив узлов' }],
    });
  }

  payload.forEach((item, index) => {
    checkNode(item, `[${index}]`, issues);
  });

  if (issues.length === 0) {
    checkGraph(payload as OrgNodeDto[], issues);
  }

  if (issues.length > 0) {
    throw new ApiError('schema', 'Org-tree response does not match the schema', { issues });
  }

  return payload as OrgNodeDto[];
}
