import { useGamificationStore } from '../store/gamificationStore';
import { useStudentStore } from '../store/studentStore';
import type { Badge } from '../models/types';
import { POINTS } from '../models/types';

// ─── Badge Definitions ─────────────────────────────────────────────────────
const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first-scan',
    name: 'First Scan',
    description: 'Scan your first word',
    icon: 'camera',
    category: 'explorer',
    condition: 'scans >= 1',
    earnedAt: null,
  },
  {
    id: 'scan-10',
    name: 'Word Hunter',
    description: 'Scan 10 words',
    icon: 'magnify',
    category: 'explorer',
    condition: 'scans >= 10',
    earnedAt: null,
  },
  {
    id: 'scan-50',
    name: 'Vocabulary Explorer',
    description: 'Scan 50 words',
    icon: 'compass',
    category: 'explorer',
    condition: 'scans >= 50',
    earnedAt: null,
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Get 10 quiz answers correct',
    icon: 'bullseye-arrow',
    category: 'scholar',
    condition: 'quizCorrect >= 10',
    earnedAt: null,
  },
  {
    id: 'streak-3',
    name: 'On Fire',
    description: '3-day learning streak',
    icon: 'fire',
    category: 'streak',
    condition: 'streak >= 3',
    earnedAt: null,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7-day learning streak',
    icon: 'trophy',
    category: 'streak',
    condition: 'streak >= 7',
    earnedAt: null,
  },
];

export function onWordScanned(wordText: string): { pointsEarned: number; newBadges: Badge[] } {
  const gamification = useGamificationStore.getState();

  gamification.incrementScanCount();
  gamification.addPoints(POINTS.SCAN);
  useStudentStore.getState().updatePoints(POINTS.SCAN);

  const newBadges = checkScanBadges(useGamificationStore.getState().scanCount);
  return {
    pointsEarned: Math.round(POINTS.SCAN * gamification.comboMultiplier),
    newBadges,
  };
}

export function onWordRead(wordText: string): { pointsEarned: number } {
  const gamification = useGamificationStore.getState();

  gamification.addPoints(POINTS.READ);
  useStudentStore.getState().updatePoints(POINTS.READ);

  return {
    pointsEarned: Math.round(POINTS.READ * gamification.comboMultiplier),
  };
}

export function onQuizAnswer(correct: boolean): { pointsEarned: number; newBadges: Badge[] } {
  const gamification = useGamificationStore.getState();

  if (correct) {
    gamification.incrementQuizCorrectCount();
    gamification.addPoints(POINTS.QUIZ_CORRECT);
    gamification.incrementCombo();
    useStudentStore.getState().updatePoints(POINTS.QUIZ_CORRECT);

    const newBadges = checkQuizBadges(useGamificationStore.getState().quizCorrectCount);
    return {
      pointsEarned: Math.round(POINTS.QUIZ_CORRECT * gamification.comboMultiplier),
      newBadges,
    };
  }

  gamification.resetCombo();
  return { pointsEarned: 0, newBadges: [] };
}

export function checkStreak(): { streakUpdated: boolean; newBadges: Badge[] } {
  const student = useStudentStore.getState();
  const gamification = useGamificationStore.getState();
  const today = new Date().toISOString().split('T')[0];

  if (student.profile.lastActiveDate === today) {
    return { streakUpdated: false, newBadges: [] };
  }

  const lastDate = new Date(student.profile.lastActiveDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) {
    gamification.updateStreak();
    gamification.addPoints(POINTS.DAILY_STREAK);
    student.updatePoints(POINTS.DAILY_STREAK);
    student.updateProfile({
      lastActiveDate: today,
      streakDays: student.profile.streakDays + 1,
    });

    const newBadges = checkStreakBadges(gamification.streak + 1);
    return { streakUpdated: true, newBadges };
  }

  // Streak broken
  student.updateProfile({ lastActiveDate: today, streakDays: 1 });
  return { streakUpdated: false, newBadges: [] };
}

// ─── Badge Checking ────────────────────────────────────────────────────────
function checkScanBadges(count: number): Badge[] {
  return awardMatchingBadges([
    { id: 'first-scan', threshold: 1 },
    { id: 'scan-10', threshold: 10 },
    { id: 'scan-50', threshold: 50 },
  ], count);
}

function checkQuizBadges(count: number): Badge[] {
  return awardMatchingBadges([
    { id: 'quiz-master', threshold: 10 },
  ], count);
}

function checkStreakBadges(streak: number): Badge[] {
  return awardMatchingBadges([
    { id: 'streak-3', threshold: 3 },
    { id: 'streak-7', threshold: 7 },
  ], streak);
}

function awardMatchingBadges(
  checks: { id: string; threshold: number }[],
  value: number,
): Badge[] {
  const gamification = useGamificationStore.getState();
  const newBadges: Badge[] = [];

  for (const { id, threshold } of checks) {
    if (value >= threshold) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === id);
      if (badge && gamification.checkBadge(badge)) {
        gamification.awardBadge(badge);
        newBadges.push({ ...badge, earnedAt: Date.now() });
      }
    }
  }

  return newBadges;
}

export function getBadgeDefinitions(): Badge[] {
  return BADGE_DEFINITIONS;
}
