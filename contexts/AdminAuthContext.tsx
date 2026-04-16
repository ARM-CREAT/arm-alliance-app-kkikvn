import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@/lib/async-storage';

export const ADMIN_AUTH_KEY = 'admin_authenticated';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isChecking: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  // Always false — never block render
  const [isChecking, setIsChecking] = useState(false);

  const recheck = useCallback(async () => {
    try {
      const flag = await AsyncStorage.getItem(ADMIN_AUTH_KEY);
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
    await AsyncStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setIsAdminAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    console.log('[AdminAuthContext] logout');
    try {
      await AsyncStorage.removeItem(ADMIN_AUTH_KEY);
    } catch (err) {
      console.error('[AdminAuthContext] Erreur suppression session:', err);
    } finally {
      setIsAdminAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    // Hard safety net: never block on AsyncStorage for more than 500ms
    const safetyTimer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

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
