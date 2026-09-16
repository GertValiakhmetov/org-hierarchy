import type { NumericRange, OrgFilter } from '@shared/types';
import { LEVEL_PLURAL, ORG_UNIT_FORMS, PERSON_FORMS } from '@/entities/org/labels';
import { formatCount, formatQuantity, formatRubles, plural } from '@/shared/lib/format';

export type FilterField = keyof OrgFilter;

export interface FilterChip {
  field: FilterField;
  label: string;
}

function describeRange(range: NumericRange, format: (value: number) => string): string {
  const { min, max } = range;

  if (min !== undefined && max !== undefined) {
    return min === max ? format(min) : `${format(min)} — ${format(max)}`;
  }
  if (min !== undefined) return `от ${format(min)}`;
  return `до ${format(max ?? 0)}`;
}

/** Turns a filter into removable chips, in a fixed order so they never jump around. */
export function describeFilter(filter: OrgFilter): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filter.name?.trim()) {
    chips.push({ field: 'name', label: `название: ${filter.name.trim()}` });
  }

  if (filter.levels) {
    const label = filter.levels.map((level) => LEVEL_PLURAL[level]).join(', ');
    chips.push({ field: 'levels', label: label || 'уровень не выбран' });
  }

  if (filter.ids) {
    const count = filter.ids.length;
    chips.push({
      field: 'ids',
      label: `выбрано ${formatCount(count)} ${plural(count, ORG_UNIT_FORMS)}`,
    });
  }

  if (filter.headcount) {
    chips.push({
      field: 'headcount',
      label: describeRange(filter.headcount, (value) => formatQuantity(value, PERSON_FORMS)),
    });
  }

  if (filter.budget) {
    chips.push({ field: 'budget', label: describeRange(filter.budget, formatRubles) });
  }

  if (filter.performance) {
    chips.push({
      field: 'performance',
      label: `эффективность ${describeRange(filter.performance, (value) => String(value))}`,
    });
  }

  return chips;
}

export function removeField(filter: OrgFilter, field: FilterField): OrgFilter {
  const next = { ...filter };
  delete next[field];
  return next;
}
