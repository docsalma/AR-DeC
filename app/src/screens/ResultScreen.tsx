import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '../store/scanStore';
import { useStudentStore } from '../store/studentStore';
import { getExplanation } from '../services/itsService';
import { onWordRead } from '../services/gamificationService';
import PointsAnimation from '../components/PointsAnimation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Explanation } from '../models/types';
import { POINTS } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

type ResultScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ResultScreen({ navigation }: ResultScreenProps) {
  const currentWord = useScanStore((s) => s.currentWord);
  const profile = useStudentStore((s) => s.profile);
  const addToHistory = useStudentStore((s) => s.addToHistory);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => {
    if (!currentWord) return;
    addToHistory(currentWord);
    onWordRead(currentWord.text);
    setShowPoints(true);
    getExplanation(
      currentWord.text,
      currentWord.context,
      profile.level,
      currentWord.masteryLevel,
    ).then(setExplanation);
  }, [currentWord?.id, profile.level]);

  if (!currentWord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="magnify" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No word selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{'\u2190'} Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PointsAnimation
        points={POINTS.READ}
        visible={showPoints}
        onComplete={() => setShowPoints(false)}
      />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityLabel="Close">
        <Text style={styles.closeText}>{'\u2715'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Word hero */}
        <View style={styles.hero}>
          <Text style={styles.wordText}>{currentWord.text}</Text>
          <View style={styles.masteryRow}>
            <View style={styles.masteryTrack}>
              <View
                style={[
                  styles.masteryFill,
                  { width: `${Math.round(currentWord.masteryLevel * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.masteryPercent}>
              {Math.round(currentWord.masteryLevel * 100)}%
            </Text>
          </View>
        </View>

        {/* Explanation sections */}
        {explanation && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
                <Text style={styles.cardTitle}>Definition</Text>
                <View style={styles.bloomsTag}>
                  <Text style={styles.bloomsText}>{explanation.bloomsLevel}</Text>
                </View>
              </View>
              <Text style={styles.definition}>{explanation.definition}</Text>
            </View>

            {explanation.examples.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="comment-text-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardTitle}>Examples</Text>
                </View>
                {explanation.examples.map((ex, i) => (
                  <View key={i} style={styles.exampleRow}>
                    <View style={styles.exampleDot} />
                    <Text style={styles.exampleText}>{ex}</Text>
                  </View>
                ))}
              </View>
            )}

            {explanation.relatedConcepts.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="link-variant" size={18} color={colors.primary} />
                  <Text style={styles.cardTitle}>Related</Text>
                </View>
                <View style={styles.conceptRow}>
                  {explanation.relatedConcepts.map((c, i) => (
                    <View key={i} style={styles.conceptChip}>
                      <Text style={styles.conceptText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Context */}
        <View style={[styles.card, styles.contextCard]}>
          <Text style={styles.contextLabel}>Original Context</Text>
          <Text style={styles.contextText}>&ldquo;{currentWord.context}&rdquo;</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ARView')}
          >
            <MaterialCommunityIcons name="cube-scan" size={18} color={colors.text} />
            <Text style={styles.actionText}>View in AR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => {
              if (useScanStore.getState().scannedWords.length < 2) {
                Alert.alert('Not enough words', 'Scan at least 2 words before starting a quiz.');
                return;
              }
              navigation.navigate('Quiz');
            }}
          >
            <MaterialCommunityIcons name="brain" size={18} color="#fff" />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>Quiz Me</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },

  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: colors.textMuted,
  },

  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  wordText: {
    color: colors.text,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: 180,
  },
  masteryTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.outlineVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  masteryPercent: {
    color: colors.primary,
    fontWeight: '700',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    color: colors.textMuted,
    flex: 1,
  },
  bloomsTag: {
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  bloomsText: {
    color: colors.purple,
    fontSize: 9,
  },
  definition: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  exampleText: {
    color: colors.textSecondary,
    flex: 1,
  },
  conceptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conceptChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  conceptText: {
    color: colors.primary,
    fontWeight: '600',
  },

  contextCard: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  contextLabel: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  contextText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.lg,
  },
  actionIcon: { fontSize: 18 },
  actionText: {
    color: colors.text,
  },
  actionTextPrimary: {
    color: '#fff',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textMuted,
  },
  backButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
  },
  backButtonText: {
    color: colors.primary,
  },
});
