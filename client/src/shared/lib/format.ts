// Constructing an Intl formatter is expensive, so each one is built once.
const integerFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** ru-RU groups digits with a no-break space, which renders as ragged columns. */
function normalizeSpaces(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, ' ');
}

export function formatRubles(value: number): string {
  return `${normalizeSpaces(integerFormatter.format(Math.round(value)))} руб.`;
}

export function formatCount(value: number): string {
  return normalizeSpaces(integerFormatter.format(value));
}

/** A node's own score is always integral; a weighted subtree average is not. */
export function formatPerformance(value: number): string {
  const formatter = Number.isInteger(value) ? integerFormatter : decimalFormatter;
  return normalizeSpaces(formatter.format(value));
}

const pluralRules = new Intl.PluralRules('ru-RU');

const PLURAL_INDEX: Record<string, 0 | 1 | 2> = { one: 0, few: 1, many: 2, other: 2 };

/** Russian noun form for a count: forms are given as [1, 2, 5]. */
export function plural(count: number, forms: [string, string, string]): string {
  return forms[PLURAL_INDEX[pluralRules.select(count)] ?? 2];
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(isoDate: string): string {
  return normalizeSpaces(dateFormatter.format(new Date(isoDate)));
}
