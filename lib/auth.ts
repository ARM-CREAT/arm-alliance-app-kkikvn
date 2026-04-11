import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

// Fallback stub — used on web and when better-auth is unavailable
const authClientStub = {
  getSession: async () => ({ data: null, error: null }),
  signIn: {
    email: async (_opts: any) => ({ data: null, error: { message: 'Auth unavailable' } }),
    social: async (_opts: any) => ({ data: null, error: { message: 'Auth unavailable' } }),
  },
  signUp: {
    email: async (_opts: any) => ({ data: null, error: { message: 'Auth unavailable' } }),
  },
  signOut: async () => ({ data: null, error: null }),
} as any;

function buildAuthClient() {
  // On web: always return stub — better-auth is stubbed by Metro to prevent
  // the deep dependency chain from crashing the web module graph.
  if (Platform.OS === 'web') {
    console.log('[auth] Web platform — using stub auth client');
    return authClientStub;
  }

  // Native path — use the real better-auth/expo client
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAuthClient } = require('better-auth/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { expoClient } = require('@better-auth/expo/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SecureStore = require('expo-secure-store');

    const client = createAuthClient({
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: 'alliancearm',
          storagePrefix: 'alliancearm',
          storage: SecureStore,
        }),
      ],
    });
    console.log('[auth] Native auth client built successfully');
    return client;
  } catch (e) {
    console.warn('[auth] buildAuthClient failed, using stub:', e);
    return authClientStub;
  }
}

// Lazily build the auth client so module evaluation never throws
let _authClient: typeof authClientStub | null = null;

function getAuthClient() {
  if (!_authClient) {
    _authClient = buildAuthClient();
  }
  return _authClient;
}

// Safe wrapper around getSession that never throws — always returns stub shape
async function safeGetSession(): Promise<{ data: any; error: any }> {
  try {
    const client = getAuthClient();
    const result = await client.getSession();
    return result ?? { data: null, error: null };
  } catch (e) {
    console.warn('[auth] getSession threw, returning null session:', e);
    return { data: null, error: null };
  }
}

// Proxy that defers client construction until first use
export const authClient = new Proxy({} as typeof authClientStub, {
  get(_target, prop) {
    // Intercept getSession to use the safe wrapper
    if (prop === 'getSession') {
      return safeGetSession;
    }
    const client = getAuthClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    if (value && typeof value === 'object') {
      // Handle nested objects like signIn.email, signUp.email
      return new Proxy(value, {
        get(obj, innerProp) {
          const innerValue = obj[innerProp];
          if (typeof innerValue === 'function') {
            return innerValue.bind(obj);
          }
          return innerValue;
        },
      });
    }
    return value;
  },
});

export async function setBearerToken(token: string) {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(BEARER_TOKEN_KEY, token); } catch { /* ignore */ }
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
    } catch { /* ignore */ }
  }
}

export async function clearAuthTokens() {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(BEARER_TOKEN_KEY); } catch { /* ignore */ }
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
    } catch { /* ignore */ }
  }
}

export { API_URL };
