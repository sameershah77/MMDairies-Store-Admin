import { useTheme } from '@/context/ThemeContext';

export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return {
    dark,
    grid: dark ? '#1a2438' : '#eef0f3',
    tick: dark ? '#8fa0bd' : '#8b96a5',
    tickMuted: dark ? '#6b7c99' : '#647084',
    tooltip: {
      borderRadius: 12,
      border: dark ? '1px solid #1a2438' : '1px solid #eef0f3',
      background: dark ? '#111b2e' : '#ffffff',
      color: dark ? '#e4eaf5' : '#1f2937',
    },
    brand: dark ? '#2dd4bf' : '#0d7377',
    brandSoft: dark ? '#14b8a6' : '#3fa896',
    accent: dark ? '#f0b429' : '#e8a838',
  };
}
