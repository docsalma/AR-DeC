import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import type { Badge } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

interface BadgePopupProps {
  badge: Badge | null;
  visible: boolean;
  onDismiss: () => void;
}

export default function BadgePopup({ badge, visible, onDismiss }: BadgePopupProps) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.3);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(onDismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!badge) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.popup, { transform: [{ scale }], opacity }]}>
          <View style={[styles.confetti, { top: -8, left: 40, backgroundColor: colors.secondary }]} />
          <View style={[styles.confetti, { top: 10, right: 20, backgroundColor: colors.error }]} />
          <View style={[styles.confetti, { bottom: 30, left: 20, backgroundColor: colors.tertiary }]} />
          <View style={[styles.confetti, { top: 40, right: -5, backgroundColor: colors.purple }]} />

          <View style={styles.iconBg}>
            <Text style={styles.emoji}>{badge.icon}</Text>
          </View>

          <Text variant="labelSmall" style={styles.unlocked}>BADGE UNLOCKED</Text>
          <Text variant="headlineSmall" style={styles.name}>{badge.name}</Text>
          <Text variant="bodyMedium" style={styles.description}>{badge.description}</Text>

          <View style={styles.divider} />
          <Text variant="labelSmall" style={styles.hint}>Tap to dismiss</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    width: 300,
    ...shadows.lg,
  },
  confetti: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  emoji: { fontSize: 40 },
  unlocked: { color: colors.secondary, letterSpacing: 2, marginBottom: spacing.xs },
  name: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  description: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  divider: {
    width: 40, height: 2, backgroundColor: colors.outlineVariant,
    borderRadius: 1, marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  hint: { color: colors.textMuted },
});
