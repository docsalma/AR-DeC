import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Badge, GamificationState, StudentLevel } from '../models/types';
import { LEVEL_THRESHOLDS } from '../models/types';
import storage from '../utils/storage';

interface GamificationActions {
  addPoints: (amount: number) => void;
  checkBadge: (badge: Badge) => boolean;
  awardBadge: (badge: Badge) => void;
  updateStreak: () => void;
  resetDaily: () => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  incrementScanCount: () => void;
  incrementQuizCorrectCount: () => void;
}

type GamificationStore = GamificationState & GamificationActions;

function computeLevel(points: number): StudentLevel {
  if (points >= LEVEL_THRESHOLDS.master) return 'master';
  if (points >= LEVEL_THRESHOLDS.scholar) return 'scholar';
  if (points >= LEVEL_THRESHOLDS.explorer) return 'explorer';
  return 'beginner';
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      points: 0,
      level: 'beginner',
      streak: 0,
      dailyGoal: 10, // words per day
      dailyProgress: 0,
      badges: [],
      comboMultiplier: 1,
      scanCount: 0,
      quizCorrectCount: 0,

      addPoints: (amount) =>
        set((state) => {
          const earned = Math.round(amount * state.comboMultiplier);
          const newPoints = state.points + earned;
          return {
            points: newPoints,
            level: computeLevel(newPoints),
            dailyProgress: state.dailyProgress + 1,
          };
        }),

      checkBadge: (badge) => {
        return !get().badges.some((b) => b.id === badge.id);
      },

      awardBadge: (badge) =>
        set((state) => ({
          badges: [...state.badges, { ...badge, earnedAt: Date.now() }],
        })),

      updateStreak: () =>
        set((state) => ({
          streak: state.streak + 1,
        })),

      resetDaily: () => set({ dailyProgress: 0, comboMultiplier: 1 }),

      incrementCombo: () =>
        set((state) => ({
          comboMultiplier: Math.min(state.comboMultiplier + 0.5, 4),
        })),

      resetCombo: () => set({ comboMultiplier: 1 }),

      incrementScanCount: () =>
        set((state) => ({
          scanCount: state.scanCount + 1,
        })),

      incrementQuizCorrectCount: () =>
        set((state) => ({
          quizCorrectCount: state.quizCorrectCount + 1,
        })),
    }),
    {
      name: 'ardec-gamification',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        points: state.points,
        level: state.level,
        streak: state.streak,
        dailyGoal: state.dailyGoal,
        dailyProgress: state.dailyProgress,
        badges: state.badges,
        scanCount: state.scanCount,
        quizCorrectCount: state.quizCorrectCount,
      }),
    }
  )
);
