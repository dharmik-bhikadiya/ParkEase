import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { mobileTheme } from '../constants/theme';

interface MobileLogoProps {
  size?: number;
  showSubtitle?: boolean;
  align?: 'center' | 'flex-start';
}

export const MobileLogo: React.FC<MobileLogoProps> = ({
  size = 52,
  showSubtitle: _showSubtitle = true,
  align = 'center',
}) => {
  return (
    <View style={[styles.container, { alignItems: align }]}>
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: size, height: size * 1.3 }}
          resizeMode="contain"
          accessibilityLabel="ParkEase Emblem"
        />
        <Image
          source={require('../../assets/parkease-text-logo.png')}
          style={{ height: size * 0.85, width: size * 2.8 }}
          resizeMode="contain"
          accessibilityLabel="ParkEase Typography"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: mobileTheme.spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default MobileLogo;
