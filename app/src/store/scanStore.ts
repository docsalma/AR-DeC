import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ScannedWord } from '../models/types';
import storage from '../utils/storage';

interface ScanState {
  scannedWords: ScannedWord[];
  currentWord: ScannedWord | null;
  isScanning: boolean;

  addWord: (word: ScannedWord) => void;
  setCurrentWord: (word: ScannedWord | null) => void;
  setScanning: (scanning: boolean) => void;
  clearHistory: () => void;
  getRecentWords: (count: number) => ScannedWord[];
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scannedWords: [],
      currentWord: null,
      isScanning: false,

      addWord: (word) =>
        set((state) => ({
          scannedWords: [word, ...state.scannedWords],
          currentWord: word,
        })),

      setCurrentWord: (word) => set({ currentWord: word }),

      setScanning: (scanning) => set({ isScanning: scanning }),

      clearHistory: () => set({ scannedWords: [], currentWord: null }),

      getRecentWords: (count) => get().scannedWords.slice(0, count),
    }),
    {
      name: 'ardec-scan',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ scannedWords: state.scannedWords }),
    }
  )
);
