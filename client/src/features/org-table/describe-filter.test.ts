import type { OrgFilter } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { describeFilter, removeField } from './describe-filter';

const labels = (filter: OrgFilter) => describeFilter(filter).map((chip) => chip.label);

describe('describeFilter', () => {
  it('produces nothing for an empty filter', () => {
    expect(describeFilter({})).toEqual([]);
  });

  it('ignores a name that is only whitespace', () => {
    expect(describeFilter({ name: '   ' })).toEqual([]);
  });

  it('describes a name search', () => {
    expect(labels({ name: 'маркет' })).toEqual(['название: маркет']);
  });

  it('describes levels in plural', () => {
    expect(labels({ levels: ['department'] })).toEqual(['отделы']);
    expect(labels({ levels: ['division', 'team'] })).toEqual(['дивизионы, команды']);
  });

  it('describes an explicit selection by count', () => {
    expect(labels({ ids: ['a', 'b', 'c'] })).toEqual(['выбрано 3 подразделения']);
    expect(labels({ ids: ['a'] })).toEqual(['выбрано 1 подразделение']);
  });

  it('describes one-sided ranges', () => {
    expect(labels({ headcount: { min: 30 } })).toEqual(['от 30 человек']);
    expect(labels({ headcount: { max: 5 } })).toEqual(['до 5 человек']);
  });

  it('describes a two-sided range', () => {
    expect(labels({ performance: { min: 60, max: 80 } })).toEqual(['эффективность 60 — 80']);
  });

  it('collapses a range whose ends coincide', () => {
    expect(labels({ headcount: { min: 12, max: 12 } })).toEqual(['12 человек']);
  });

  it('formats budgets as money', () => {
    expect(labels({ budget: { min: 10_000_000 } })).toEqual(['от 10 000 000 руб.']);
  });

  it('keeps a stable order regardless of key order in the object', () => {
    const fields = describeFilter({
      performance: { max: 60 },
      name: 'а',
      headcount: { min: 1 },
      levels: ['team'],
    }).map((chip) => chip.field);

    expect(fields).toEqual(['name', 'levels', 'headcount', 'performance']);
  });
});

describe('removeField', () => {
  it('drops one condition and keeps the rest', () => {
    const filter: OrgFilter = { name: 'а', levels: ['team'], headcount: { min: 3 } };

    expect(removeField(filter, 'levels')).toEqual({ name: 'а', headcount: { min: 3 } });
  });

  it('does not mutate the original', () => {
    const filter: OrgFilter = { name: 'а', levels: ['team'] };
    removeField(filter, 'name');

    expect(filter).toEqual({ name: 'а', levels: ['team'] });
  });
});
