export const colors = {
  // Primary - Koyu Mavi
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',

  // Gradient (summary card)
  gradientStart: '#1E40AF',
  gradientEnd: '#0D9488',

  // Success - Yeşil
  secondary: '#10B981',
  secondaryDark: '#065F46',
  secondaryLight: '#D1FAE5',

  // Danger - Kırmızı
  danger: '#EF4444',
  dangerDark: '#991B1B',
  dangerLight: '#FEE2E2',

  // Warning - Amber (yeni)
  warning: '#F59E0B',
  warningDark: '#92400E',
  warningLight: '#FEF3C7',

  // Dark Theme - Surface Katmanları
  background: '#0F172A',      // Level 0 - sayfa zemini
  surface: '#1E293B',         // Level 1 - kartlar
  surfaceElevated: '#334155', // Level 2 - input, iç kartlar

  // Dark Theme - Metin Hiyerarşisi
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  subText: '#94A3B8',
  textHint: '#64748B',

  // Border
  border: '#334155',
  borderLight: '#475569',

  // Diğer
  dark: '#0F172A',
  inputBg: '#334155',
} as const;

export type AppColors = typeof colors;
