// Web-safe auth client — pure fetch, no better-auth/react dependency.
// This avoids the ESM/Node.js crash that better-auth causes in Metro web bundles.

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

function getStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
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
    const result = await apiFetch('/api/auth/get-session');
    if (result.error || !result.data) return { data: null, error: result.error };
    return { data: result.data, error: null };
  },
  signIn: {
    email: async (opts: { email: string; password: string }) => {
      console.log('[auth.web] signIn.email', opts.email);
      return apiFetch('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
    social: async (opts: { provider: string; callbackURL?: string }) => {
      console.log('[auth.web] signIn.social', opts.provider);
      return apiFetch('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },
  signUp: {
    email: async (opts: { email: string; password: string; name?: string }) => {
      console.log('[auth.web] signUp.email', opts.email);
      return apiFetch('/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify(opts),
      });
    },
  },
  signOut: async () => {
    console.log('[auth.web] signOut');
    return apiFetch('/api/auth/sign-out', { method: 'POST' });
  },
};

export async function setBearerToken(token: string) {
  try { getStorage()?.setItem(BEARER_TOKEN_KEY, token); } catch {}
}

export async function clearAuthTokens() {
  try { getStorage()?.removeItem(BEARER_TOKEN_KEY); } catch {}
}
