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

/** Metrics a patch may carry; also the cells a client highlights. */
export type PatchField = 'headcount' | 'budget' | 'performance';

export const PATCH_FIELDS: readonly PatchField[] = ['headcount', 'budget', 'performance'];

export interface OrgNodePatch {
  id: string;
  headcount?: number;
  budget?: number;
  performance?: number;
  updatedAt: string;
}

/**
 * `version` counts changes since the server started. The client compares the
 * version in `hello` with the last one it saw: equal means the cache survived
 * the disconnect untouched and no refetch is needed.
 */
export type LiveMessage =
  | { type: 'hello'; version: number }
  | { type: 'node-updated'; version: number; patch: OrgNodePatch };
