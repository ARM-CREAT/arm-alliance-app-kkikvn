// Native (iOS/Android) auth client with expoClient plugin and SecureStore.

import { createAuthClient } from 'better-auth/react';

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

// Lazy-require SecureStore so a missing native module never crashes the JS bundle.
function getSecureStore() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

// Build a storage adapter for expoClient.
// Falls back to a no-op if SecureStore is unavailable (e.g. Expo Go on some devices).
function buildStorage() {
  const SS = getSecureStore();
  if (!SS) {
    return {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
    };
  }
  return {
    getItem: (key: string) => SS.getItemAsync(key),
    setItem: (key: string, value: string) => SS.setItemAsync(key, value),
    removeItem: (key: string) => SS.deleteItemAsync(key),
  };
}

// Build the auth client — wrap in try/catch so a plugin failure never crashes the app.
function buildAuthClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { expoClient } = require('@better-auth/expo/client');
    return createAuthClient({
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: 'alliancearm',
          storagePrefix: 'alliancearm',
          storage: buildStorage(),
        }),
      ],
    });
  } catch (e) {
    console.warn('[auth.native] expoClient failed, falling back to base client:', e);
    return createAuthClient({ baseURL: API_URL });
  }
}

export const authClient = buildAuthClient();

export async function setBearerToken(token: string) {
  try {
    const SS = getSecureStore();
    if (SS) await SS.setItemAsync(BEARER_TOKEN_KEY, token);
  } catch {}
}

export async function clearAuthTokens() {
  try {
    const SS = getSecureStore();
    if (SS) await SS.deleteItemAsync(BEARER_TOKEN_KEY);
  } catch {}
}
