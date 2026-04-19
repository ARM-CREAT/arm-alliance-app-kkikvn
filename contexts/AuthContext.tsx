import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { authClient, setBearerToken, clearAuthTokens } from '@/lib/auth';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
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
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function safeSetBearerToken(token: string) {
  try {
    await withTimeout(setBearerToken(token), 500);
  } catch {
    // Non-fatal
  }
}

async function safeClearAuthTokens() {
  try {
    await withTimeout(clearAuthTokens(), 500);
  } catch {
    // Non-fatal
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('[AuthContext] Initializing auth state, platform:', Platform.OS);

    const safetyTimer = setTimeout(() => {
      console.warn('[AuthContext] Hard 2s safety timer fired — forcing loading=false');
      if (isMountedRef.current) {
        setLoading(false);
        setUser(null);
      }
    }, 2000);

    if (Platform.OS === 'web') {
      console.log('[AuthContext] Web platform — skipping session check');
      clearTimeout(safetyTimer);
      return () => {
        isMountedRef.current = false;
      };
    }

    const initAuth = async () => {
      try {
        const session = await withTimeout(authClient.getSession(), 1000);
        if (!isMountedRef.current) return;
        if (session?.data?.user) {
          setUser(session.data.user as User);
          if (session.data.session?.token) {
            safeSetBearerToken(session.data.session.token);
          }
        } else {
          setUser(null);
          safeClearAuthTokens();
        }
      } catch (error) {
        console.warn('[AuthContext] initAuth failed (non-blocking):', error);
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
      console.warn('[AuthContext] fetchUser safety timer fired — forcing loading=false');
      if (isMountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }, 3000);

    try {
      const session = await withTimeout(authClient.getSession(), 2500);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          safeSetBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        safeClearAuthTokens();
      }
    } catch (error) {
      console.warn('[AuthContext] Failed to fetch user (non-blocking):', error);
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
      const result = await authClient.signIn.email({ email, password });
      if (result?.error) {
        const msg = result.error.message || result.error.code || 'Échec de la connexion';
        console.error('[AuthContext] signIn.email error:', msg);
        throw new Error(msg);
      }
      await fetchUser();
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] signUpWithEmail:', email);
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result?.error) {
        const msg = result.error.message || result.error.code || 'Échec de la création du compte';
        console.error('[AuthContext] signUp.email error:', msg);
        throw new Error(msg);
      }
      await fetchUser();
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signInWithSocial = async (provider: 'google' | 'apple' | 'github') => {
    console.log('[AuthContext] signInWithSocial:', provider);
    try {
      if (Platform.OS === 'web') {
        const token = await openOAuthPopup(provider);
        await safeSetBearerToken(token);
        await fetchUser();
      } else {
        const callbackURL = Linking.createURL('/admin/dashboard');
        await authClient.signIn.social({ provider, callbackURL });
        await fetchUser();
      }
    } catch (error) {
      console.error(`[AuthContext] ${provider} sign in failed:`, error);
      throw error;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signInWithGoogle = () => signInWithSocial('google');
  const signInWithApple = () => signInWithSocial('apple');
  const signInWithGitHub = () => signInWithSocial('github');

  const signOut = async () => {
    console.log('[AuthContext] signOut');
    setUser(null);
    setLoading(false);
    try {
      await withTimeout(authClient.signOut(), 3000);
    } catch (error) {
      console.warn('[AuthContext] Sign out API call failed (non-blocking):', error);
    } finally {
      safeClearAuthTokens();
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
