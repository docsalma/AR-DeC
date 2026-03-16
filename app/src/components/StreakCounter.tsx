import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { colors, spacing } from '../theme';

interface StreakCounterProps {
  days: number;
  compact?: boolean;
}

export default function StreakCounter({ days, compact }: StreakCounterProps) {
  const isActive = days > 0;

  return (
    <Surface
      style={[
        styles.container,
        compact && styles.compact,
        !isActive && styles.inactive,
      ]}
      elevation={isActive ? 2 : 0}
    >
      <Text style={[styles.icon, !isActive && styles.iconInactive]}>
        {isActive ? '\u{1F525}' : '\u{2744}\u{FE0F}'}
      </Text>
      <View>
        <Text variant={compact ? 'labelLarge' : 'titleLarge'} style={styles.count}>
          {days}
        </Text>
        {!compact && (
          <Text variant="labelSmall" style={styles.label}>
            day{days !== 1 ? 's' : ''} streak
          </Text>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  compact: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999 },
  inactive: { backgroundColor: colors.surfaceVariant },
  icon: { fontSize: 22 },
  iconInactive: { opacity: 0.4 },
  count: { color: colors.secondaryDark, fontWeight: '800' },
  label: { color: colors.secondaryDark, marginTop: -2 },
});
