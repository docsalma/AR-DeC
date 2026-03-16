import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StudentProfile, StudentLevel, ScannedWord } from '../models/types';
import { LEVEL_THRESHOLDS } from '../models/types';
import storage from '../utils/storage';

interface StudentState {
  profile: StudentProfile;
  vocabularyMap: Record<string, ScannedWord>;

  updateMastery: (wordId: string, newMastery: number) => void;
  addToHistory: (word: ScannedWord) => void;
  getWeakWords: (threshold?: number) => ScannedWord[];
  updatePoints: (points: number) => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
}

function computeLevel(points: number): StudentLevel {
  if (points >= LEVEL_THRESHOLDS.master) return 'master';
  if (points >= LEVEL_THRESHOLDS.scholar) return 'scholar';
  if (points >= LEVEL_THRESHOLDS.explorer) return 'explorer';
  return 'beginner';
}

const defaultProfile: StudentProfile = {
  id: 'local-student',
  name: 'Student',
  points: 0,
  level: 'beginner',
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  badges: [],
  vocabularyHistory: [],
};

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      vocabularyMap: {},

      updateMastery: (wordId, newMastery) => {
        const map = get().vocabularyMap;
        const word = map[wordId];
        if (word) {
          set({
            vocabularyMap: { ...map, [wordId]: { ...word, masteryLevel: newMastery } },
          });
        }
      },

      addToHistory: (word) => {
        const map = get().vocabularyMap;
        set((state) => ({
          vocabularyMap: { ...map, [word.id]: word },
          profile: {
            ...state.profile,
            vocabularyHistory: [
              word.id,
              ...state.profile.vocabularyHistory.filter((id) => id !== word.id),
            ],
          },
        }));
      },

      getWeakWords: (threshold = 0.4) => {
        const map = get().vocabularyMap;
        return Object.values(map).filter((w) => w.masteryLevel < threshold);
      },

      updatePoints: (points) =>
        set((state) => {
          const newPoints = state.profile.points + points;
          return {
            profile: {
              ...state.profile,
              points: newPoints,
              level: computeLevel(newPoints),
            },
          };
        }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
    }),
    {
      name: 'ardec-student',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        profile: state.profile,
        vocabularyMap: state.vocabularyMap,
      }),
    }
  )
);
