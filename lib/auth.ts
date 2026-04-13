// Web-safe auth client — no SecureStore, no expoClient plugin.
// Native uses lib/auth.native.ts which has the full expoClient setup.

import { createAuthClient } from 'better-auth/react';

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export async function setBearerToken(token: string) {
  try { localStorage.setItem(BEARER_TOKEN_KEY, token); } catch {}
}

export async function clearAuthTokens() {
  try { localStorage.removeItem(BEARER_TOKEN_KEY); } catch {}
}
