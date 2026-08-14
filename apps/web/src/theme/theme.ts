import { PARKEASE_COLORS } from '@parkease/shared';

export const webTheme = {
  colors: PARKEASE_COLORS,
  shadows: {
    softSm: '0 2px 8px rgba(23, 107, 77, 0.04)',
    softMd: '0 8px 24px rgba(23, 107, 77, 0.06)',
    softLg: '0 16px 36px rgba(23, 107, 77, 0.08)',
  },
  borderRadius: {
    card: '1.5rem',
    button: '1rem',
    badge: '9999px',
  },
} as const;
