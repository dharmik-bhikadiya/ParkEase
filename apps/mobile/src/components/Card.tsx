import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { mobileTheme } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: mobileTheme.colors.cardBackground,
    borderRadius: mobileTheme.borderRadius.lg,
    padding: mobileTheme.spacing.lg,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    shadowColor: mobileTheme.colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
});
