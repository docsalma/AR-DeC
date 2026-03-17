import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ProgressBar,
  Surface,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '../store/scanStore';
import { useStudentStore } from '../store/studentStore';
import { useGamificationStore } from '../store/gamificationStore';
import type { ScannedWord } from '../models/types';
import { colors, spacing, shadows } from '../theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const scannedWords = useScanStore((s) => s.scannedWords);
  const profile = useStudentStore((s) => s.profile);
  const { dailyProgress, dailyGoal, level, points } = useGamificationStore();
  const recentWords = scannedWords.slice(0, 10);
  const goalProgress = dailyGoal > 0 ? dailyProgress / dailyGoal : 0;

  const handleWordPress = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  const renderWordItem = ({ item }: { item: ScannedWord }) => {
    const masteryPercent = Math.round(item.masteryLevel * 100);
    const masteryColor = item.masteryLevel < 0.25 ? colors.error
      : item.masteryLevel < 0.5 ? colors.secondary
      : item.masteryLevel < 0.75 ? colors.primary
      : colors.tertiary;
    const masteryLabel = item.masteryLevel < 0.25 ? 'New'
      : item.masteryLevel < 0.5 ? 'Learning'
      : item.masteryLevel < 0.75 ? 'Familiar'
      : 'Mastered';

    return (
      <Card style={styles.wordCard} onPress={() => handleWordPress(item)} mode="elevated">
        <Card.Content style={styles.wordCardContent}>
          <View style={styles.wordCardLeft}>
            <Text variant="titleMedium" style={styles.wordText}>{item.text}</Text>
            {item.context ? (
              <Text variant="bodySmall" style={styles.wordContext} numberOfLines={1}>
                {item.context}
              </Text>
            ) : null}
            <ProgressBar
              progress={item.masteryLevel}
              color={masteryColor}
              style={styles.masteryBar}
            />
          </View>
          <Chip
            compact
            textStyle={{ fontSize: 10, color: masteryColor }}
            style={[styles.masteryChip, { borderColor: masteryColor }]}
          >
            {masteryLabel}
          </Chip>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentWords}
        keyExtractor={(item) => item.id}
        renderItem={renderWordItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text variant="headlineMedium" style={styles.greeting}>
                  Hi, {profile.name}!
                </Text>
                <View style={styles.levelRow}>
                  <Chip
                    compact
                    icon="star"
                    textStyle={styles.levelChipText}
                    style={styles.levelChip}
                  >
                    {level.toUpperCase()}
                  </Chip>
                  <Text variant="bodySmall" style={styles.pointsLabel}>
                    {profile.points} points
                  </Text>
                </View>
              </View>
              {profile.streakDays > 0 && (
                <Surface style={styles.streakBadge} elevation={2}>
                  <MaterialCommunityIcons name="fire" size={20} color={colors.secondary} />
                  <Text variant="titleMedium" style={styles.streakCount}>{profile.streakDays}</Text>
                  <Text variant="labelSmall" style={styles.streakLabel}>streak</Text>
                </Surface>
              )}
            </View>

            {/* Daily progress card */}
            <Card style={styles.progressCard} mode="elevated">
              <Card.Content>
                <View style={styles.progressHeader}>
                  <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
                  <Text variant="titleSmall" style={styles.progressTitle}>Daily Goal</Text>
                  <Text variant="bodySmall" style={styles.progressCount}>
                    {dailyProgress}/{dailyGoal}
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(1, goalProgress)}
                  color={goalProgress >= 1 ? colors.tertiary : colors.primary}
                  style={styles.dailyProgressBar}
                />
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statValue}>
                      {profile.vocabularyHistory.length}
                    </Text>
                    <Text variant="labelSmall" style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statValue}>
                      {profile.points}
                    </Text>
                    <Text variant="labelSmall" style={styles.statLabel}>Points</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={styles.statValue}>
                      {Math.round(goalProgress * 100)}%
                    </Text>
                    <Text variant="labelSmall" style={styles.statLabel}>Goal</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Scan CTA */}
            <Button
              mode="contained"
              icon="camera"
              onPress={() => navigation.navigate('ScanTab')}
              style={styles.scanButton}
              contentStyle={styles.scanButtonContent}
              labelStyle={styles.scanButtonLabel}
            >
              Scan Textbook
            </Button>

            {/* Quick actions */}
            <View style={styles.quickActions}>
              <Surface style={styles.quickBtn} elevation={1}>
                <IconButton
                  icon="brain"
                  iconColor={colors.purple}
                  size={28}
                  onPress={() => {
                    if (useScanStore.getState().scannedWords.length < 2) {
                      Alert.alert('Not enough words', 'Scan at least 2 words before starting a quiz.');
                      return;
                    }
                    navigation.navigate('Quiz');
                  }}
                />
                <Text variant="labelSmall" style={styles.quickLabel}>Quiz</Text>
              </Surface>
              <Surface style={styles.quickBtn} elevation={1}>
                <IconButton
                  icon="trophy"
                  iconColor={colors.secondary}
                  size={28}
                  onPress={() => navigation.navigate('ProfileTab')}
                />
                <Text variant="labelSmall" style={styles.quickLabel}>Badges</Text>
              </Surface>
              <Surface style={styles.quickBtn} elevation={1}>
                <IconButton
                  icon="cube-scan"
                  iconColor={colors.tertiary}
                  size={28}
                  onPress={() => navigation.navigate('ARView')}
                />
                <Text variant="labelSmall" style={styles.quickLabel}>AR View</Text>
              </Surface>
            </View>

            {/* Section header */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {recentWords.length > 0 ? 'Recent Words' : 'Your Learning Journey'}
            </Text>

            {/* Empty state */}
            {recentWords.length === 0 && (
              <Card style={styles.emptyCard} mode="outlined">
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons name="book-open-variant" size={56} color={colors.primary} style={styles.emptyIcon} />
                  <Text variant="titleMedium" style={styles.emptyTitle}>
                    Ready to start learning?
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Point your camera at any textbook page. We'll help you understand every word with AI explanations, AR overlays, and fun quizzes!
                  </Text>
                  <Button
                    mode="contained-tonal"
                    icon="camera"
                    onPress={() => navigation.navigate('ScanTab')}
                    style={styles.emptyButton}
                  >
                    Start Scanning
                  </Button>
                </Card.Content>
              </Card>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.huge },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  greeting: { color: colors.text, fontWeight: '700' },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  levelChip: {
    backgroundColor: colors.primaryLight,
    height: 28,
  },
  levelChipText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  pointsLabel: { color: colors.textSecondary },

  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  streakIcon: { fontSize: 20 },
  streakCount: { color: colors.secondaryDark, fontWeight: '800' },
  streakLabel: { color: colors.secondaryDark },

  progressCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 20,
    paddingBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTitle: { flex: 1, color: colors.text, fontWeight: '600' },
  progressCount: { color: colors.textSecondary },
  dailyProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.outlineVariant },

  scanButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  scanButtonContent: { paddingVertical: spacing.sm },
  scanButtonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  quickActions: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  quickLabel: { color: colors.textSecondary, marginTop: -4 },

  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  wordCard: {
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    borderRadius: 14,
  },
  wordCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCardLeft: { flex: 1 },
  wordText: { color: colors.text, fontWeight: '700' },
  wordContext: { color: colors.textSecondary, marginTop: 2 },
  masteryBar: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceVariant,
  },
  masteryChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginLeft: spacing.md,
    height: 28,
  },

  emptyCard: {
    marginHorizontal: spacing.xl,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderColor: colors.outline,
  },
  emptyContent: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: { marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  emptyButton: { marginTop: spacing.xl, borderRadius: 12 },
});
