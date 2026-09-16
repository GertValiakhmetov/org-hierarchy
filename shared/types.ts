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

export interface NumericRange {
  min?: number;
  max?: number;
}

/**
 * Result of interpreting a search query. Every field is optional and they are
 * combined with AND; an empty filter matches everything, which is what plain
 * text search degrades to.
 *
 * Numeric ranges are compared against a node's rolled-up totals, not its own
 * values — those are the numbers the table shows.
 */
export interface OrgFilter {
  name?: string;
  /** Explicit selection, used when a query names nodes no substring would match. */
  ids?: string[];
  levels?: OrgLevel[];
  headcount?: NumericRange;
  budget?: NumericRange;
  performance?: NumericRange;
}

export type SortColumn = 'name' | 'level' | 'headcount' | 'budget' | 'performance';

export interface SortSpec {
  column: SortColumn;
  direction: 'asc' | 'desc';
}

export type SearchSource = 'ai' | 'text';

/** Why the plain-text path was taken; shown to the user so the UI never claims AI ran. */
export type SearchFallbackReason = 'not-configured' | 'failed' | 'invalid';

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  source: SearchSource;
  filter: OrgFilter;
  sort?: SortSpec;
  reason?: SearchFallbackReason;
}

export const MAX_SEARCH_QUERY_LENGTH = 300;
