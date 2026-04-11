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
    console.log('[AdminAuthContext] Vérification session admin...');
    try {
      const flag = await AsyncStorage.getItem(ADMIN_AUTH_KEY);
      const authenticated = flag === 'true';
      console.log('[AdminAuthContext] admin_authenticated:', flag, '→', authenticated);
      setIsAdminAuthenticated(authenticated);
    } catch (err) {
      console.error('[AdminAuthContext] Erreur lecture AsyncStorage:', err);
      setIsAdminAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async () => {
    console.log('[AdminAuthContext] Enregistrement session admin');
    await AsyncStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setIsAdminAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    console.log('[AdminAuthContext] Déconnexion admin — suppression session');
    try {
      await AsyncStorage.removeItem(ADMIN_AUTH_KEY);
    } catch (err) {
      console.error('[AdminAuthContext] Erreur suppression session:', err);
    } finally {
      setIsAdminAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    // Safety net: never block on AsyncStorage for more than 500ms
    const safetyTimer = setTimeout(() => {
      console.warn('[AdminAuthContext] Safety timer fired — forcing isChecking=false');
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
