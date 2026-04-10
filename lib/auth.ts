import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

// Fallback stub — used when better-auth is unavailable
const authClientStub = {
  getSession: async () => ({ data: null, error: null }),
  signIn: {
    email: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
    social: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
  },
  signUp: {
    email: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
  },
  signOut: async () => ({ data: null, error: null }),
} as any;

function buildAuthClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAuthClient } = require('better-auth/react');

    if (Platform.OS === 'web') {
      return createAuthClient({
        baseURL: API_URL,
        fetchOptions: {
          credentials: 'include' as const,
          auth: {
            type: 'Bearer' as const,
            token: () => {
              try { return localStorage.getItem(BEARER_TOKEN_KEY) || ''; } catch { return ''; }
            },
          },
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { expoClient } = require('@better-auth/expo/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SecureStore = require('expo-secure-store');

    return createAuthClient({
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: 'alliancearm',
          storagePrefix: 'alliancearm',
          storage: SecureStore,
        }),
      ],
    });
  } catch (e) {
    console.warn('[auth] buildAuthClient failed, using stub:', e);
    return authClientStub;
  }
}

export const authClient = buildAuthClient();

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
