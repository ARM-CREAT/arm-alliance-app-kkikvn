// Web-safe AsyncStorage implementation using localStorage.
// Replaces @react-native-async-storage/async-storage which requires a native build.

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
  },
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return keys.map(k => [k, typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null]);
    } catch {
      return keys.map(k => [k, null]);
    }
  },
  multiSet: async (pairs: [string, string][]): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') pairs.forEach(([k, v]) => localStorage.setItem(k, v));
    } catch {}
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') keys.forEach(k => localStorage.removeItem(k));
    } catch {}
  },
  clear: async (): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.clear();
    } catch {}
  },
  getAllKeys: async (): Promise<string[]> => {
    try {
      return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
    } catch {
      return [];
    }
  },
  mergeItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage === 'undefined') return;
      const existing = localStorage.getItem(key);
      const merged = existing
        ? JSON.stringify(Object.assign({}, JSON.parse(existing), JSON.parse(value)))
        : value;
      localStorage.setItem(key, merged);
    } catch {}
  },
  flushGetRequests: () => {},
};

export default AsyncStorage;
