export type PerformanceBand = 'high' | 'medium' | 'low';

const HIGH_THRESHOLD = 80;
const MEDIUM_THRESHOLD = 60;

export function performanceBand(value: number): PerformanceBand {
  if (value >= HIGH_THRESHOLD) return 'high';
  if (value >= MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

export const PERFORMANCE_LABEL: Record<PerformanceBand, string> = {
  high: 'высокая эффективность',
  medium: 'средняя эффективность',
  low: 'низкая эффективность',
};
