// Stub for @react-native-async-storage/async-storage
// Uses in-memory storage so the web preview works without native modules.
const store = {};

const AsyncStorage = {
  getItem: (key) => Promise.resolve(store[key] !== undefined ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); return Promise.resolve(); },
  removeItem: (key) => { delete store[key]; return Promise.resolve(); },
  mergeItem: (key, value) => {
    try {
      const existing = store[key] ? JSON.parse(store[key]) : {};
      const merged = Object.assign({}, existing, JSON.parse(value));
      store[key] = JSON.stringify(merged);
    } catch (e) {
      store[key] = value;
    }
    return Promise.resolve();
  },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); return Promise.resolve(); },
  getAllKeys: () => Promise.resolve(Object.keys(store)),
  multiGet: (keys) => Promise.resolve(keys.map(k => [k, store[k] !== undefined ? store[k] : null])),
  multiSet: (pairs) => { pairs.forEach(([k, v]) => { store[k] = String(v); }); return Promise.resolve(); },
  multiRemove: (keys) => { keys.forEach(k => delete store[k]); return Promise.resolve(); },
  multiMerge: (pairs) => Promise.resolve(),
  flushGetRequests: () => {},
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
module.exports.AsyncStorage = AsyncStorage;
