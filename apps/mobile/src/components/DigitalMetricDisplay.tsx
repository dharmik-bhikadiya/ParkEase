import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { mobileTheme } from '../constants/theme';

interface DigitalMetricDisplayProps {
  label: string;
  value: string | number;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'giant';
  variant?: 'emerald' | 'dark' | 'white';
  style?: ViewStyle;
  valueStyle?: TextStyle;
}

export const DigitalMetricDisplay: React.FC<DigitalMetricDisplayProps> = ({
  label,
  value,
  subtitle,
  size = 'lg',
  variant = 'emerald',
  style,
  valueStyle,
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 28;
      case 'md':
        return 38;
      case 'giant':
        return 64;
      case 'lg':
      default:
        return 48;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'dark':
        return '#0F172A';
      case 'white':
        return '#FFFFFF';
      case 'emerald':
      default:
        return '#10B981';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label Text - Uppercase, Spaced, Crisp */}
      <Text style={styles.label}>{label.toUpperCase()}</Text>

      {/* Main Primary Digital Clock Style Number */}
      <Text
        style={[
          styles.numberText,
          {
            fontSize: getFontSize(),
            color: getTextColor(),
            lineHeight: getFontSize() * 1.02,
          },
          valueStyle,
        ]}
      >
        {value}
      </Text>

      {/* Optional Subtitle */}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.0,
    color: '#047857',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  numberText: {
    fontWeight: '900',
    letterSpacing: -1.8,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(16, 185, 129, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
});
