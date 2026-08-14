import { PARKEASE_COLORS } from '@parkease/shared';

export const mobileTheme = {
  colors: {
    ...PARKEASE_COLORS,
    textDark: PARKEASE_COLORS.textPrimary,
    primaryGreen: PARKEASE_COLORS.primary,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    pill: 999,
  },
};
