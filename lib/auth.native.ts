// Native (iOS/Android) auth client — pure fetch + SecureStore, no better-auth/react.
// This avoids the ESM/Node.js crash that better-auth causes in Metro bundles.

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

function getSecureStore() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      credentials: 'include',
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`);
      let msg = text;
      try { msg = JSON.parse(text)?.message || JSON.parse(text)?.error || text; } catch {}
      return { data: null, error: { message: msg, code: String(res.status) } };
    }
    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (e: any) {
    clearTimeout(timer);
    return { data: null, error: { message: e?.message || 'Network error', code: 'NETWORK_ERROR' } };
  }
}

export const authClient = {
  getSession: async () => {
    // Attach bearer token if available
    const SS = getSecureStore();
    let token: string | null = null;
    try { if (SS) token = await SS.getItemAsync(BEARER_TOKEN_KEY); } catch {}
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const result = await apiFetch('/api/auth/get-session', { headers });
    if (result.error || !result.data) return { data: null, error: result.error };
    return { data: result.data, error: null };
  },
  signIn: {
    email: async (opts: { email: string; password: string }) => {
      console.log('[auth.native] signIn.email', opts.email);
      return apiFetch('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
    social: async (opts: { provider: string; callbackURL?: string }) => {
      console.log('[auth.native] signIn.social', opts.provider);
      return apiFetch('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },
  signUp: {
    email: async (opts: { email: string; password: string; name?: string }) => {
      console.log('[auth.native] signUp.email', opts.email);
      return apiFetch('/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },
  signOut: async () => {
    console.log('[auth.native] signOut');
    return apiFetch('/api/auth/sign-out', { method: 'POST' });
  },
};

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
