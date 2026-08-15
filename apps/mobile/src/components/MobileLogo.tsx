import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { mobileTheme } from '../constants/theme';

interface MobileLogoProps {
  size?: number;
  showSubtitle?: boolean;
  align?: 'center' | 'flex-start';
}

export const MobileLogo: React.FC<MobileLogoProps> = ({
  size = 56,
  showSubtitle = true,
  align = 'center',
}) => {
  return (
    <View style={[styles.container, { alignItems: align }]}>
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: size, height: size, borderRadius: size * 0.2 }}
          resizeMode="contain"
          accessibilityLabel="ParkEase Logo"
        />
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>
            Park<Text style={styles.brandAccent}>Ease</Text>
          </Text>
          {showSubtitle && (
            <Text style={styles.brandSubtitle}>PARK SMART • MOVE EASY</Text>
          )}
        </View>
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
    gap: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: mobileTheme.colors.textDark,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: mobileTheme.colors.darkGreen,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: mobileTheme.colors.primaryGreen,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});

export default MobileLogo;
