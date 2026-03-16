import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors, shadows } from '../theme';

interface PointsAnimationProps {
  points: number;
  visible: boolean;
  onComplete?: () => void;
}

export default function PointsAnimation({ points, visible, onComplete }: PointsAnimationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(0);
      scale.setValue(0.5);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.3, tension: 200, friction: 8, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(800),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -60, duration: 500, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => onComplete?.());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }, { scale }] }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>+{points}</Text>
      <Text style={styles.sparkle}>{'\u2728'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
    ...shadows.lg,
  },
  text: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sparkle: { fontSize: 20 },
});
