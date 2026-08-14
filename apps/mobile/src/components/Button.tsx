import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { mobileTheme } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'outline':
        return styles.btnOutline;
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      default:
        return styles.textLight;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.baseBtn, getButtonStyle(), disabled && styles.disabled, style]}
    >
      <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseBtn: {
    paddingVertical: mobileTheme.spacing.md,
    paddingHorizontal: mobileTheme.spacing.lg,
    borderRadius: mobileTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: mobileTheme.colors.primary,
  },
  btnSecondary: {
    backgroundColor: mobileTheme.colors.darkGreen,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: mobileTheme.colors.darkGreen,
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontWeight: '700',
    fontSize: 16,
  },
  textLight: {
    color: mobileTheme.colors.textPrimary,
  },
  textOutline: {
    color: mobileTheme.colors.darkGreen,
  },
});
