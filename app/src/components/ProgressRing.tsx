import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressRing({
  progress,
  size = 90,
  strokeWidth = 6,
  color = colors.primary,
  label,
  showPercentage = true,
}: ProgressRingProps) {
  const percentage = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[styles.ring, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: colors.surfaceVariant,
        }]}
      />
      <View
        style={[styles.ring, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: 'transparent',
          borderRightColor: progress > 0.125 ? color : progress > 0 ? color : 'transparent',
          borderBottomColor: progress > 0.375 ? color : 'transparent',
          borderLeftColor: progress > 0.625 ? color : 'transparent',
          borderTopColor: progress > 0.875 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }]}
      />
      <View style={[styles.center, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
        {showPercentage && (
          <Text variant="titleLarge" style={[styles.percent, { color }]}>{percentage}%</Text>
        )}
        {label && <Text variant="labelSmall" style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute' },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  percent: { fontWeight: '700' },
  label: { color: colors.textSecondary, marginTop: 1 },
});
