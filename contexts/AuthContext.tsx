import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Lazy-load auth client to prevent any module-level crash from taking down the app
function getAuthClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/auth');
    return {
      authClient: mod.authClient,
      setBearerToken: mod.setBearerToken,
      clearAuthTokens: mod.clearAuthTokens,
    };
  } catch (e) {
    console.warn('[AuthContext] Failed to load auth module:', e);
    return {
      authClient: {
        getSession: async () => ({ data: null, error: null }),
        signIn: {
          email: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
          social: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
        },
        signUp: {
          email: async () => ({ data: null, error: { message: 'Auth unavailable' } }),
        },
        signOut: async () => ({ data: null, error: null }),
      },
      setBearerToken: async () => {},
      clearAuthTokens: async () => {},
    };
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  loading: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithGitHub: async () => {},
  signOut: async () => {},
  fetchUser: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        reject(new Error('OAuth popup not available on this platform.'));
        return;
      }
      const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        popupUrl,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );
      if (!popup) {
        reject(new Error('Failed to open popup. Please allow popups.'));
        return;
      }
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'oauth-success' && event.data?.token) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          resolve(event.data.token);
        } else if (event.data?.type === 'oauth-error') {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          reject(new Error(event.data.error || 'OAuth failed'));
        }
      };
      window.addEventListener('message', handleMessage);
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication cancelled'));
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[AuthContext] Initializing, platform:', Platform.OS);

    // On web, skip session check — it causes CORS issues in the preview iframe
    if (Platform.OS === 'web') {
      console.log('[AuthContext] Web platform — skipping session check');
      return () => { isMountedRef.current = false; };
    }

    // Safety net — always resolve within 2s
    const safetyTimer = setTimeout(() => {
      console.warn('[AuthContext] Safety timer fired — forcing loading=false');
      if (isMountedRef.current) setLoading(false);
    }, 2000);

    const initAuth = async () => {
      try {
        const { authClient, setBearerToken, clearAuthTokens } = getAuthClient();
        const session = await withTimeout(authClient.getSession(), 1500);
        if (!isMountedRef.current) return;
        if (session?.data?.user) {
          setUser(session.data.user as User);
          if (session.data.session?.token) {
            try { await withTimeout(setBearerToken(session.data.session.token), 500); } catch {}
          }
        } else {
          setUser(null);
          try { await withTimeout(clearAuthTokens(), 500); } catch {}
        }
      } catch (err) {
        console.warn('[AuthContext] initAuth failed (non-blocking):', err);
        if (isMountedRef.current) setUser(null);
      } finally {
        clearTimeout(safetyTimer);
        if (isMountedRef.current) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    console.log('[AuthContext] fetchUser called');
    const safetyTimer = setTimeout(() => {
      isFetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }, 3000);
    try {
      const { authClient, setBearerToken, clearAuthTokens } = getAuthClient();
      const session = await withTimeout(authClient.getSession(), 2500);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          try { await withTimeout(setBearerToken(session.data.session.token), 500); } catch {}
        }
      } else {
        setUser(null);
        try { await withTimeout(clearAuthTokens(), 500); } catch {}
      }
    } catch (err) {
      console.warn('[AuthContext] fetchUser failed (non-blocking):', err);
      if (isMountedRef.current) setUser(null);
    } finally {
      clearTimeout(safetyTimer);
      isFetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[AuthContext] signInWithEmail:', email);
    try {
      const { authClient } = getAuthClient();
      const result = await authClient.signIn.email({ email, password });
      if (result?.error) {
        const msg = result.error.message || result.error.code || 'Échec de la connexion';
        console.error('[AuthContext] signIn.email error:', msg);
        throw new Error(msg);
      }
      await fetchUser();
    } catch (err) {
      if (isMountedRef.current) setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] signUpWithEmail:', email);
    try {
      const { authClient } = getAuthClient();
      const result = await authClient.signUp.email({ email, password, name });
      if (result?.error) {
        const msg = result.error.message || result.error.code || 'Échec de la création du compte';
        console.error('[AuthContext] signUp.email error:', msg);
        throw new Error(msg);
      }
      await fetchUser();
    } catch (err) {
      if (isMountedRef.current) setLoading(false);
      throw err;
    }
  };

  const signInWithSocial = async (provider: 'google' | 'apple' | 'github') => {
    console.log('[AuthContext] signInWithSocial:', provider);
    try {
      const { authClient, setBearerToken } = getAuthClient();
      if (Platform.OS === 'web') {
        const token = await openOAuthPopup(provider);
        try { await withTimeout(setBearerToken(token), 500); } catch {}
        await fetchUser();
      } else {
        const callbackURL = Linking.createURL('/admin/dashboard');
        await authClient.signIn.social({ provider, callbackURL });
        await fetchUser();
      }
    } catch (err) {
      console.error(`[AuthContext] ${provider} sign in failed:`, err);
      if (isMountedRef.current) setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = () => signInWithSocial('google');
  const signInWithApple = () => signInWithSocial('apple');
  const signInWithGitHub = () => signInWithSocial('github');

  const signOut = async () => {
    console.log('[AuthContext] signOut');
    if (isMountedRef.current) {
      setUser(null);
      setLoading(false);
    }
    try {
      const { authClient, clearAuthTokens } = getAuthClient();
      await withTimeout(authClient.signOut(), 3000);
      try { await withTimeout(clearAuthTokens(), 500); } catch {}
    } catch (err) {
      console.warn('[AuthContext] signOut API call failed (non-blocking):', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
