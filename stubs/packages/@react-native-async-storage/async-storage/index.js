const AsyncStorage = {
  getItem: async (key) => { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; } },
  setItem: async (key, value) => { try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch {} },
  removeItem: async (key) => { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {} },
  multiGet: async (keys) => { try { return keys.map(k => [k, typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null]); } catch { return keys.map(k => [k, null]); } },
  multiSet: async (pairs) => { try { if (typeof localStorage !== 'undefined') pairs.forEach(([k, v]) => localStorage.setItem(k, v)); } catch {} },
  multiRemove: async (keys) => { try { if (typeof localStorage !== 'undefined') keys.forEach(k => localStorage.removeItem(k)); } catch {} },
  clear: async () => { try { if (typeof localStorage !== 'undefined') localStorage.clear(); } catch {} },
  getAllKeys: async () => { try { return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : []; } catch { return []; } },
  flushGetRequests: () => {},
  mergeItem: async () => {},
};
module.exports = { default: AsyncStorage, ...AsyncStorage };
