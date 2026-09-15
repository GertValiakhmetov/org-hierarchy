import { describe, expect, it } from 'vitest';
import { formatCount, formatPerformance, formatRubles, plural } from './format';

describe('formatRubles', () => {
  it('groups digits and appends the currency unit', () => {
    expect(formatRubles(12_345_678)).toBe('12 345 678 руб.');
  });

  it('rounds fractional amounts to whole rubles', () => {
    expect(formatRubles(1_000.6)).toBe('1 001 руб.');
  });

  it('uses a plain space, not a no-break one', () => {
    expect(formatRubles(1_000_000)).not.toMatch(/[\u00A0\u202F]/);
  });
});

describe('formatCount', () => {
  it('groups digits', () => {
    expect(formatCount(1_234)).toBe('1 234');
  });
});

describe('formatPerformance', () => {
  it('prints an integer without a fractional part', () => {
    expect(formatPerformance(67)).toBe('67');
  });

  it('prints a fractional value with one decimal', () => {
    expect(formatPerformance(72.38)).toBe('72,4');
  });
});

describe('plural', () => {
  const forms: [string, string, string] = ['подразделение', 'подразделения', 'подразделений'];

  it.each([
    [1, 'подразделение'],
    [2, 'подразделения'],
    [4, 'подразделения'],
    [5, 'подразделений'],
    [11, 'подразделений'],
    [21, 'подразделение'],
    [51, 'подразделение'],
    [0, 'подразделений'],
  ])('%i → %s', (count, expected) => {
    expect(plural(count, forms)).toBe(expected);
  });
});
