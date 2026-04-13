// Cross-platform AsyncStorage implementation.
// Web: uses localStorage. Native: uses expo-secure-store.
// Falls back gracefully if either is unavailable.

import { Platform } from 'react-native';

function getSecureStore() {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

const SecureStore = getSecureStore();

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {}
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {}
  },

  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      if (Platform.OS === 'web') {
        return keys.map(k => [k, typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null]);
      }
      if (SecureStore) {
        const results = await Promise.all(keys.map(k => SecureStore.getItemAsync(k)));
        return keys.map((k, i) => [k, results[i] ?? null]);
      }
      return keys.map(k => [k, null]);
    } catch {
      return keys.map(k => [k, null]);
    }
  },

  multiSet: async (pairs: [string, string][]): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') pairs.forEach(([k, v]) => localStorage.setItem(k, v));
        return;
      }
      if (SecureStore) {
        await Promise.all(pairs.map(([k, v]) => SecureStore.setItemAsync(k, v)));
      }
    } catch {}
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') keys.forEach(k => localStorage.removeItem(k));
        return;
      }
      if (SecureStore) {
        await Promise.all(keys.map(k => SecureStore.deleteItemAsync(k)));
      }
    } catch {}
  },

  clear: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.clear();
      }
      // SecureStore has no bulk-clear — skip on native
    } catch {}
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  mergeItem: async (key: string, value: string): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(key);
      const merged = existing
        ? JSON.stringify(Object.assign({}, JSON.parse(existing), JSON.parse(value)))
        : value;
      await AsyncStorage.setItem(key, merged);
    } catch {}
  },

  flushGetRequests: () => {},
};

export default AsyncStorage;
