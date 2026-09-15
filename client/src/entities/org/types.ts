import type { OrgLevel, OrgNodeDto } from '@shared/types';

export interface OrgNode extends OrgNodeDto {
  depth: number;
  level: OrgLevel;
  children: OrgNode[];
}

export interface OrgTree {
  roots: OrgNode[];
  byId: ReadonlyMap<string, OrgNode>;
  /** Depth-first order — the row order of the table, matching the tree visually. */
  order: readonly string[];
  size: number;
}

export const LEVEL_LABEL: Record<OrgLevel, string> = {
  division: 'Дивизион',
  department: 'Отдел',
  team: 'Команда',
};

const LEVEL_BY_DEPTH: readonly OrgLevel[] = ['division', 'department', 'team'];

/** The model has no level below team, so anything deeper is reported as one. */
export function levelFromDepth(depth: number): OrgLevel {
  return LEVEL_BY_DEPTH[Math.min(depth, LEVEL_BY_DEPTH.length - 1)] ?? 'team';
}
