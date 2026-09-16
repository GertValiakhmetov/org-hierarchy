export const theme = {
  color: {
    background: '#f5f6f8',
    surface: '#ffffff',
    surfaceMuted: '#fafbfc',
    border: '#e2e5ea',
    borderStrong: '#cdd3db',
    textPrimary: '#131920',
    textSecondary: '#5c6675',
    textMuted: '#8b94a3',
    accent: '#2f6df6',
    accentSoft: '#e8efff',
    highlight: '#bed6ff',
    focus: '#2f6df6',
    danger: '#d64545',
    dangerSoft: '#fdecec',
  },
  performance: {
    high: '#1f9d63',
    medium: '#d99400',
    low: '#d64545',
  },
  space: (steps: number): string => `${steps * 4}px`,
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  font: {
    sans: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  },
  size: {
    xs: '11px',
    sm: '12px',
    md: '13px',
    lg: '15px',
    xl: '19px',
  },
  shadow: {
    card: '0 1px 2px rgba(19, 25, 32, 0.04), 0 1px 8px rgba(19, 25, 32, 0.04)',
  },
} as const;

export type AppTheme = typeof theme;
