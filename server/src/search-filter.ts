import { z } from 'zod';
import type { OrgFilter, OrgNodeDto, SearchResponse, SortSpec } from '../../shared/types.ts';

/**
 * Every field is nullable rather than optional: structured outputs require the
 * whole schema to be present in the response, and `null` is how the model says
 * "this condition does not apply".
 */
const Range = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});

export const FilterSchema = z.object({
  name: z.string().nullable(),
  ids: z.array(z.string()).nullable(),
  levels: z.array(z.enum(['division', 'department', 'team'])).nullable(),
  headcount: Range.nullable(),
  budget: Range.nullable(),
  performance: Range.nullable(),
  sort: z
    .object({
      column: z.enum(['name', 'level', 'headcount', 'budget', 'performance']),
      direction: z.enum(['asc', 'desc']),
    })
    .nullable(),
});

export type ParsedFilter = z.infer<typeof FilterSchema>;

const INSTRUCTIONS = `Ты разбираешь поисковый запрос по орг-структуре компании в структурированный фильтр.

Поля фильтра, все необязательные — ставь null, если условие не следует из запроса:
- name: подстрока названия подразделения. Только если пользователь явно назвал часть имени.
- ids: список id подразделений. Используй, когда запрос описывает подразделения по смыслу,
  а подстрока их не найдёт (например «продажники» — это команды про продажи).
- levels: уровни иерархии. division — дивизион, department — отдел, team — команда.
- headcount, budget, performance: диапазоны { min, max }, границы включительные.
  Любую границу можно оставить null. performance — число от 0 до 100. budget — в рублях.
- sort: сортировка, если запрос просит упорядочить («самые дорогие», «худшие по эффективности»).

Числовые условия сравниваются с суммарными показателями подразделения, включая все вложенные.
То есть «отдел больше 50 человек» — это весь штат отдела вместе с его командами.

Не выдумывай условий, которых нет в запросе. Если запрос не содержит ничего, кроме названия,
заполни только name.`;

/** A node is a department when something points at it, a team when nothing does. */
function levelOf(node: OrgNodeDto, nodes: readonly OrgNodeDto[]): string {
  if (node.parentId === null) return 'division';
  return nodes.some((candidate) => candidate.parentId === node.id) ? 'department' : 'team';
}

export function buildSystemPrompt(nodes: readonly OrgNodeDto[]): string {
  const list = nodes.map((node) => `${node.id}|${node.name}|${levelOf(node, nodes)}`).join('\n');
  return `${INSTRUCTIONS}\n\nПодразделения компании (id|название|уровень):\n${list}`;
}

/** Drops nulls so the wire format matches OrgFilter, where absent means "no condition". */
export function toOrgFilter(parsed: ParsedFilter): Pick<SearchResponse, 'filter' | 'sort'> {
  const filter: OrgFilter = {};

  if (parsed.name?.trim()) filter.name = parsed.name.trim();
  if (parsed.ids?.length) filter.ids = parsed.ids;
  if (parsed.levels?.length) filter.levels = parsed.levels;

  for (const field of ['headcount', 'budget', 'performance'] as const) {
    const range = parsed[field];
    if (!range) continue;

    const bounds: { min?: number; max?: number } = {};
    if (range.min !== null) bounds.min = range.min;
    if (range.max !== null) bounds.max = range.max;
    if (Object.keys(bounds).length > 0) filter[field] = bounds;
  }

  return parsed.sort ? { filter, sort: parsed.sort satisfies SortSpec } : { filter };
}
