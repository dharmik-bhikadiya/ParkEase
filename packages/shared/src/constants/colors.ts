/**
 * ParkEase Design Tokens & Color Palette
 * Premium minimal UI design palette centered around soft off-whites, clean greens, and dark accents.
 */

export const PARKEASE_COLORS = {
  background: '#F7F9F5',
  cardBackground: '#FFFFFF',
  primary: '#72C98B',
  primaryHover: '#5CB976',
  darkGreen: '#176B4D',
  softGreen: '#E8F6EC',
  textPrimary: '#18342A',
  textMuted: '#58746B',
  border: '#E1E9E3',
  error: '#E53935',
  warning: '#FB8C00',
  info: '#1E88E5',
  success: '#4CAF50',
} as const;

export type ParkEaseColor = keyof typeof PARKEASE_COLORS;
