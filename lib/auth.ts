import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.backendUrl || 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

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

export const authClient = authClientStub;

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
