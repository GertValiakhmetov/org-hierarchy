export interface OrgNodeDto {
  id: string;
  name: string;
  /** null marks a root of the forest (a division). */
  parentId: string | null;
  /** The node's own staff only — descendants are not included. */
  headcount: number;
  /** The node's own budget in rubles only — descendants are not included. */
  budget: number;
  /** 0–100. */
  performance: number;
  /** ISO-8601. */
  updatedAt: string;
}

export type OrgTreeResponse = OrgNodeDto[];

/** Derived on the client from a node's depth; the API carries no such field. */
export type OrgLevel = 'division' | 'department' | 'team';

/**
 * Server behaviour switch driven by POST /api/debug/mode. It alters the regular
 * GET /api/org-tree instead of introducing a separate request, so failures land
 * on the very query the app runs on.
 */
export type DebugMode = 'normal' | 'slow' | 'empty' | 'error' | 'invalid';

export const DEBUG_MODES: readonly DebugMode[] = ['normal', 'slow', 'empty', 'error', 'invalid'];

export interface DebugModeResponse {
  mode: DebugMode;
}
