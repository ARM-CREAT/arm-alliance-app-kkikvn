// Web-safe auth client — no SecureStore, no expoClient plugin.
// Native uses lib/auth.native.ts which has the full expoClient setup.
//
// IMPORTANT: better-auth/react uses Node.js internals that can crash the web
// Metro bundler. We lazy-require it inside a function so the import is deferred
// until runtime (after the web polyfills are in place), not at module-eval time.

export const API_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BEARER_TOKEN_KEY = 'alliance-arm_bearer_token';

// Build a minimal no-op auth client that satisfies the AuthContext interface
// without making any network calls. Used as a fallback if better-auth fails.
function makeNoopClient() {
  const noopSession = { data: null, error: null };
  return {
    getSession: async () => noopSession,
    signIn: {
      email: async (_opts: { email: string; password: string }) => ({ error: { message: 'Auth not available on web' } }),
      social: async (_opts: { provider: string; callbackURL?: string }) => ({ error: null }),
    },
    signUp: {
      email: async (_opts: { email: string; password: string; name?: string }) => ({ error: { message: 'Auth not available on web' } }),
    },
    signOut: async () => ({ error: null }),
  };
}

function buildAuthClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAuthClient } = require('better-auth/react');
    return createAuthClient({ baseURL: API_URL });
  } catch (e) {
    console.warn('[auth.web] better-auth/react failed to load, using noop client:', e);
    return makeNoopClient();
  }
}

export const authClient = buildAuthClient();

export async function setBearerToken(token: string) {
  try { localStorage.setItem(BEARER_TOKEN_KEY, token); } catch {}
}

export async function clearAuthTokens() {
  try { localStorage.removeItem(BEARER_TOKEN_KEY); } catch {}
}
