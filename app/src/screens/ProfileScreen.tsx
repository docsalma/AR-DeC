import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useStudentStore } from '../store/studentStore';
import { useGamificationStore } from '../store/gamificationStore';
import { useScanStore } from '../store/scanStore';
import ProgressRing from '../components/ProgressRing';
import StreakCounter from '../components/StreakCounter';
import WordCard from '../components/WordCard';
import { getBadgeDefinitions } from '../services/gamificationService';
import { colors, spacing, radii, shadows } from '../theme';

export default function ProfileScreen() {
  const profile = useStudentStore((s) => s.profile);
  const vocabularyMap = useStudentStore((s) => s.vocabularyMap);
  const gamification = useGamificationStore();
  const scannedWords = useScanStore((s) => s.scannedWords);

  const allBadges = getBadgeDefinitions();
  const earnedBadgeIds = new Set(gamification.badges.map((b) => b.id));
  const earnedCount = earnedBadgeIds.size;

  const masteredWords = Object.values(vocabularyMap).filter(
    (w) => w.masteryLevel >= 0.8,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.levelPill}>
            <Text style={styles.levelText}>{gamification.level.toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{'\u2B50'}</Text>
            <Text style={styles.statValue}>{profile.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <StreakCounter days={profile.streakDays} compact />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{'\u{1F4DA}'}</Text>
            <Text style={styles.statValue}>{scannedWords.length}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{'\u{1F3AF}'}</Text>
            <Text style={styles.statValue}>{masteredWords.length}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        {/* Daily goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <View style={styles.dailyRow}>
            <ProgressRing
              progress={gamification.dailyGoal > 0 ? gamification.dailyProgress / gamification.dailyGoal : 0}
              size={80}
              label="today"
            />
            <View style={styles.dailyInfo}>
              <Text style={styles.dailyCount}>
                {gamification.dailyProgress}/{gamification.dailyGoal}
              </Text>
              <Text style={styles.dailyLabel}>words scanned today</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <Text style={styles.sectionCount}>{earnedCount}/{allBadges.length}</Text>
          </View>
          <View style={styles.badgeGrid}>
            {allBadges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <View
                  key={badge.id}
                  style={[styles.badgeItem, earned && styles.badgeEarned]}
                >
                  <Text style={[styles.badgeIcon, !earned && styles.badgeLocked]}>
                    {badge.icon}
                  </Text>
                  <Text
                    style={[styles.badgeName, !earned && styles.badgeNameLocked]}
                    numberOfLines={1}
                  >
                    {badge.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Vocabulary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Vocabulary ({scannedWords.length})
          </Text>
          {scannedWords.length === 0 ? (
            <Text style={styles.emptyText}>
              No words scanned yet. Start scanning to build your vocabulary!
            </Text>
          ) : (
            <>
              {scannedWords.slice(0, 15).map((word) => (
                <WordCard key={word.id} word={word} compact />
              ))}
              {scannedWords.length > 15 && (
                <Text style={styles.moreText}>
                  +{scannedWords.length - 15} more words
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.huge },

  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32, fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 22, fontWeight: '700',
    color: colors.text,
  },
  levelPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  levelText: {
    fontSize: 11, fontWeight: '700',
    color: colors.primary,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    ...shadows.sm,
  },
  statEmoji: { fontSize: 22, marginBottom: spacing.xs },
  statValue: {
    fontSize: 24, fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xl,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCount: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  dailyInfo: { flex: 1 },
  dailyCount: {
    fontSize: 28, fontWeight: '800',
    color: colors.text,
  },
  dailyLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceVariant,
  },
  badgeEarned: {
    backgroundColor: colors.secondaryLight,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  badgeIcon: { fontSize: 28 },
  badgeLocked: { opacity: 0.3 },
  badgeName: {
    fontSize: 10, fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  badgeNameLocked: { color: colors.textMuted },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  moreText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
