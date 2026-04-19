import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Lazy-load AsyncStorage to prevent module-level crashes
function getStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/lib/async-storage').default;
  } catch {
    return null;
  }
}

export const ADMIN_AUTH_KEY = 'admin_authenticated';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isChecking: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => Promise<void>;
}

const defaultContext: AdminAuthContextType = {
  isAdminAuthenticated: false,
  isChecking: false,
  login: async () => {},
  logout: async () => {},
  recheck: async () => {},
};

const AdminAuthContext = createContext<AdminAuthContextType>(defaultContext);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const recheck = useCallback(async () => {
    try {
      const storage = getStorage();
      if (!storage) {
        setIsAdminAuthenticated(false);
        return;
      }
      const flag = await Promise.race([
        storage.getItem(ADMIN_AUTH_KEY),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 800)),
      ]);
      setIsAdminAuthenticated(flag === 'true');
    } catch (err) {
      console.warn('[AdminAuthContext] recheck failed:', err);
      setIsAdminAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async () => {
    console.log('[AdminAuthContext] login');
    setIsAdminAuthenticated(true);
    try {
      const storage = getStorage();
      if (storage) {
        await Promise.race([
          storage.setItem(ADMIN_AUTH_KEY, 'true'),
          new Promise<void>(resolve => setTimeout(resolve, 800)),
        ]);
      }
    } catch (err) {
      console.warn('[AdminAuthContext] Failed to persist login state:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AdminAuthContext] logout');
    setIsAdminAuthenticated(false);
    try {
      const storage = getStorage();
      if (storage) {
        await Promise.race([
          storage.removeItem(ADMIN_AUTH_KEY),
          new Promise<void>(resolve => setTimeout(resolve, 800)),
        ]);
      }
    } catch (err) {
      console.warn('[AdminAuthContext] Failed to clear login state:', err);
    }
  }, []);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      console.warn('[AdminAuthContext] Safety timer fired — forcing isChecking=false');
      setIsChecking(false);
    }, 2000);

    recheck().finally(() => clearTimeout(safetyTimer));
  }, [recheck]);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isChecking, login, logout, recheck }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default AdminAuthContext;
