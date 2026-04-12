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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Always start as false — never block render
  const [loading, setLoading] = useState(false);
  const isFetchingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // On web: skip session check entirely — auth client is a stub
    if (Platform.OS === 'web') {
      return () => { isMountedRef.current = false; };
    }

    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) setLoading(false);
    }, 500);

    initAuth().finally(() => {
      clearTimeout(safetyTimer);
    });

    const subscription = Linking.addEventListener('url', (_event) => {
      setTimeout(() => fetchUserSilent(), 500);
    });

    const intervalId = setInterval(() => {
      fetchUserSilent();
    }, 5 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      clearInterval(intervalId);
      clearTimeout(safetyTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAuth = async () => {
    try {
      const session = await withTimeout(authClient.getSession(), 400);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error('[AuthContext] initAuth failed:', error);
      if (isMountedRef.current) setUser(null);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchUserSilent = async () => {
    try {
      const session = await withTimeout(authClient.getSession(), 5000);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error('[AuthContext] Silent session refresh failed:', error);
    }
  };

  const fetchUser = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }, 3000);

    try {
      const session = await withTimeout(authClient.getSession(), 2500);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error('[AuthContext] Failed to fetch user:', error);
      if (isMountedRef.current) setUser(null);
    } finally {
      clearTimeout(safetyTimer);
      isFetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('[AuthContext] signInWithEmail:', email);
    const result = await authClient.signIn.email({ email, password });
    if (result?.error) {
      const msg = result.error.message || result.error.code || 'Échec de la connexion';
      console.error('[AuthContext] signIn.email error:', msg);
      throw new Error(msg);
    }
    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] signUpWithEmail:', email);
    const result = await authClient.signUp.email({ email, password, name });
    if (result?.error) {
      const msg = result.error.message || result.error.code || 'Échec de la création du compte';
      console.error('[AuthContext] signUp.email error:', msg);
      throw new Error(msg);
    }
    await fetchUser();
  };

  const signInWithSocial = async (provider: 'google' | 'apple' | 'github') => {
    console.log('[AuthContext] signInWithSocial:', provider);
    try {
      if (Platform.OS === 'web') {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        const callbackURL = Linking.createURL('/admin/dashboard');
        await authClient.signIn.social({ provider, callbackURL });
        await fetchUser();
      }
    } catch (error) {
      console.error(`[AuthContext] ${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial('google');
  const signInWithApple = () => signInWithSocial('apple');
  const signInWithGitHub = () => signInWithSocial('github');

  const signOut = async () => {
    console.log('[AuthContext] signOut');
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('[AuthContext] Sign out failed (API):', error);
    } finally {
      setUser(null);
      await clearAuthTokens();
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
