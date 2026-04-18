import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@/lib/async-storage';

export const ADMIN_AUTH_KEY = 'admin_authenticated';

// Max time to wait for AsyncStorage before giving up
const STORAGE_TIMEOUT_MS = 800;

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isChecking: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/** Race a promise against a timeout — returns null on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  // Always false — never block render
  const [isChecking, setIsChecking] = useState(false);

  const recheck = useCallback(async () => {
    try {
      const flag = await withTimeout(AsyncStorage.getItem(ADMIN_AUTH_KEY), STORAGE_TIMEOUT_MS);
      setIsAdminAuthenticated(flag === 'true');
    } catch (err) {
      console.error('[AdminAuthContext] Erreur lecture AsyncStorage:', err);
      setIsAdminAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async () => {
    console.log('[AdminAuthContext] login');
    setIsAdminAuthenticated(true); // Optimistic update — don't wait for storage
    try {
      await withTimeout(AsyncStorage.setItem(ADMIN_AUTH_KEY, 'true'), STORAGE_TIMEOUT_MS);
    } catch (err) {
      console.warn('[AdminAuthContext] Failed to persist login state:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AdminAuthContext] logout');
    setIsAdminAuthenticated(false); // Optimistic update — don't wait for storage
    try {
      await withTimeout(AsyncStorage.removeItem(ADMIN_AUTH_KEY), STORAGE_TIMEOUT_MS);
    } catch (err) {
      console.warn('[AdminAuthContext] Erreur suppression session:', err);
    }
  }, []);

  useEffect(() => {
    // Hard safety net: never block on AsyncStorage for more than 800 ms
    const safetyTimer = setTimeout(() => {
      console.warn('[AdminAuthContext] Safety timer fired — forcing isChecking=false');
      setIsChecking(false);
    }, STORAGE_TIMEOUT_MS + 100);

    recheck().finally(() => clearTimeout(safetyTimer));
  }, [recheck]);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isChecking, login, logout, recheck }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
