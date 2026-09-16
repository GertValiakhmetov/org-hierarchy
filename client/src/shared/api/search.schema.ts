import type { OrgFilter, SearchResponse, SortSpec } from '@shared/types';
import { ApiError, type ValidationIssue } from '@/shared/transport/errors';

const LEVELS = ['division', 'department', 'team'] as const;
const SORT_COLUMNS = ['name', 'level', 'headcount', 'budget', 'performance'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRange(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  bounds: { min: number; max?: number },
): OrgFilter['headcount'] {
  if (value === undefined) return undefined;

  if (!isRecord(value)) {
    issues.push({ path, message: 'ожидался объект диапазона' });
    return undefined;
  }

  const range: { min?: number; max?: number } = {};

  for (const edge of ['min', 'max'] as const) {
    const raw = value[edge];
    if (raw === undefined || raw === null) continue;

    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      issues.push({ path: `${path}.${edge}`, message: 'ожидалось конечное число' });
      continue;
    }
    if (raw < bounds.min || (bounds.max !== undefined && raw > bounds.max)) {
      issues.push({ path: `${path}.${edge}`, message: 'значение вне допустимого диапазона' });
      continue;
    }
    range[edge] = raw;
  }

  if (range.min !== undefined && range.max !== undefined && range.min > range.max) {
    issues.push({ path, message: 'нижняя граница больше верхней' });
    return undefined;
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

function readFilter(value: unknown, issues: ValidationIssue[]): OrgFilter {
  if (!isRecord(value)) {
    issues.push({ path: 'filter', message: 'ожидался объект фильтра' });
    return {};
  }

  const filter: OrgFilter = {};

  if (typeof value.name === 'string' && value.name.trim() !== '') {
    filter.name = value.name;
  }

  if (Array.isArray(value.ids)) {
    const ids = value.ids.filter((id): id is string => typeof id === 'string' && id !== '');
    if (ids.length !== value.ids.length) {
      issues.push({ path: 'filter.ids', message: 'ожидались непустые строки' });
    }
    filter.ids = ids;
  }

  if (Array.isArray(value.levels)) {
    const levels = value.levels.filter((level): level is (typeof LEVELS)[number] =>
      LEVELS.includes(level as (typeof LEVELS)[number]),
    );
    if (levels.length !== value.levels.length) {
      issues.push({ path: 'filter.levels', message: 'неизвестный уровень' });
    }
    if (levels.length > 0) filter.levels = levels;
  }

  const headcount = readRange(value.headcount, 'filter.headcount', issues, { min: 0 });
  if (headcount) filter.headcount = headcount;

  const budget = readRange(value.budget, 'filter.budget', issues, { min: 0 });
  if (budget) filter.budget = budget;

  const performance = readRange(value.performance, 'filter.performance', issues, {
    min: 0,
    max: 100,
  });
  if (performance) filter.performance = performance;

  return filter;
}

function readSort(value: unknown, issues: ValidationIssue[]): SortSpec | undefined {
  if (value === undefined || value === null) return undefined;

  if (!isRecord(value)) {
    issues.push({ path: 'sort', message: 'ожидался объект сортировки' });
    return undefined;
  }

  const column = value.column;
  const direction = value.direction;

  if (!SORT_COLUMNS.includes(column as (typeof SORT_COLUMNS)[number])) {
    issues.push({ path: 'sort.column', message: `неизвестный столбец «${String(column)}»` });
    return undefined;
  }
  if (direction !== 'asc' && direction !== 'desc') {
    issues.push({ path: 'sort.direction', message: 'ожидалось asc или desc' });
    return undefined;
  }

  return { column: column as SortSpec['column'], direction };
}

/**
 * The filter originates from a language model, so it is treated as hostile
 * input: unknown keys are dropped, ranges are clamped to the domain and a
 * violation fails the response rather than reaching the table.
 */
export function parseSearchResponse(payload: unknown): SearchResponse {
  const issues: ValidationIssue[] = [];

  if (!isRecord(payload)) {
    throw new ApiError('schema', 'Search response does not match the schema', {
      issues: [{ path: '$', message: 'ожидался объект' }],
    });
  }

  if (payload.source !== 'ai' && payload.source !== 'text') {
    issues.push({ path: 'source', message: `ожидалось ai или text, получено «${String(payload.source)}»` });
  }

  const filter = readFilter(payload.filter, issues);
  const sort = readSort(payload.sort, issues);

  if (issues.length > 0) {
    throw new ApiError('schema', 'Search response does not match the schema', { issues });
  }

  const response: SearchResponse = { source: payload.source as SearchResponse['source'], filter };
  if (sort) response.sort = sort;
  if (typeof payload.reason === 'string') {
    response.reason = payload.reason as SearchResponse['reason'];
  }

  return response;
}
