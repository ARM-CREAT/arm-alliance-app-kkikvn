// Cross-platform AsyncStorage implementation.
// Uses @react-native-async-storage/async-storage on native,
// and localStorage on web.

import { Platform } from 'react-native';

// Lazy-require to avoid crashing on web where the native module isn't available.
function getNativeAsyncStorage() {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      const store = getNativeAsyncStorage();
      if (store) return await store.getItem(key);
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
      const store = getNativeAsyncStorage();
      if (store) await store.setItem(key, value);
    } catch {}
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      const store = getNativeAsyncStorage();
      if (store) await store.removeItem(key);
    } catch {}
  },

  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      if (Platform.OS === 'web') {
        return keys.map(k => [k, typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null]);
      }
      const store = getNativeAsyncStorage();
      if (store) {
        const results: [string, string | null][] = await store.multiGet(keys);
        return results;
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
      const store = getNativeAsyncStorage();
      if (store) await store.multiSet(pairs);
    } catch {}
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') keys.forEach(k => localStorage.removeItem(k));
        return;
      }
      const store = getNativeAsyncStorage();
      if (store) await store.multiRemove(keys);
    } catch {}
  },

  clear: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        return;
      }
      const store = getNativeAsyncStorage();
      if (store) await store.clear();
    } catch {}
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
      }
      const store = getNativeAsyncStorage();
      if (store) {
        const keys = await store.getAllKeys();
        return keys ?? [];
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
