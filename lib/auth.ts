import { createAuthClient } from '@better-auth/expo';
import { Platform } from 'react-native';

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export async function setBearerToken(token: string) {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(BEARER_TOKEN_KEY, token); } catch {}
  } else {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
    } catch {}
  }
}

export async function clearAuthTokens() {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(BEARER_TOKEN_KEY); } catch {}
  } else {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
    } catch {}
  }
}
