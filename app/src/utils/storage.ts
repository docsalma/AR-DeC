import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

// On web: use localStorage. On native: use AsyncStorage.
const storage: StateStorage = Platform.OS === 'web'
  ? {
      getItem: (name) => {
        const value = localStorage.getItem(name);
        return value ?? null;
      },
      setItem: (name, value) => localStorage.setItem(name, value),
      removeItem: (name) => localStorage.removeItem(name),
    }
  : (() => {
      // Lazy import to avoid bundling on web
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return {
        getItem: async (name: string) => AsyncStorage.getItem(name),
        setItem: async (name: string, value: string) => AsyncStorage.setItem(name, value),
        removeItem: async (name: string) => AsyncStorage.removeItem(name),
      };
    })();

export default storage;
