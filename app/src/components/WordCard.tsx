import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, ProgressBar } from 'react-native-paper';
import type { ScannedWord } from '../models/types';
import { colors, spacing } from '../theme';

interface WordCardProps {
  word: ScannedWord;
  onPress?: (word: ScannedWord) => void;
  compact?: boolean;
}

const MASTERY = [
  { threshold: 0, color: colors.error, label: 'New' },
  { threshold: 0.25, color: colors.secondary, label: 'Learning' },
  { threshold: 0.5, color: colors.primary, label: 'Familiar' },
  { threshold: 0.75, color: colors.tertiary, label: 'Mastered' },
];

function getMastery(level: number) {
  for (let i = MASTERY.length - 1; i >= 0; i--) {
    if (level >= MASTERY[i].threshold) return MASTERY[i];
  }
  return MASTERY[0];
}

export default function WordCard({ word, onPress, compact }: WordCardProps) {
  const m = getMastery(word.masteryLevel);

  return (
    <Card
      style={styles.card}
      onPress={() => onPress?.(word)}
      mode="elevated"
    >
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleMedium" style={styles.word}>{word.text}</Text>
          {!compact && word.context ? (
            <Text variant="bodySmall" style={styles.context} numberOfLines={1}>
              {word.context}
            </Text>
          ) : null}
          <ProgressBar
            progress={word.masteryLevel}
            color={m.color}
            style={styles.bar}
          />
        </View>
        <Chip
          compact
          textStyle={{ fontSize: 10, color: m.color }}
          style={[styles.chip, { borderColor: m.color }]}
        >
          {m.label}
        </Chip>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.lg,
    borderRadius: 14,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  word: { color: colors.text, fontWeight: '700' },
  context: { color: colors.textSecondary, marginTop: 2 },
  bar: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceVariant,
  },
  chip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginLeft: spacing.md,
    height: 28,
  },
});
