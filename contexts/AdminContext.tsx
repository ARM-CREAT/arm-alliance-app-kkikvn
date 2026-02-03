
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminContextType {
  isAdmin: boolean;
  adminToken: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  adminToken: null,
  login: async () => false,
  logout: () => {
    console.log('AdminContext: logout called');
  },
  loading: true,
});

export const useAdmin = () => useContext(AdminContext);

const ADMIN_TOKEN_KEY = '@arm_admin_token';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredToken = useCallback(async () => {
    console.log('[AdminContext] Loading stored admin token');
    try {
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (token) {
        console.log('[AdminContext] Found stored admin token');
        setAdminToken(token);
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('[AdminContext] Error loading admin token:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

  const login = async (password: string): Promise<boolean> => {
    console.log('[AdminContext] Admin login attempt');
    
    // Simple password check (in production, this should be done on the backend)
    const ADMIN_PASSWORD = 'ARM2026Admin!';
    
    if (password === ADMIN_PASSWORD) {
      const token = 'admin_' + Date.now();
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
      setAdminToken(token);
      setIsAdmin(true);
      console.log('[AdminContext] Admin login successful');
      return true;
    }
    
    console.log('[AdminContext] Admin login failed');
    return false;
  };

  const logout = async () => {
    console.log('[AdminContext] Admin logout');
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, adminToken, login, logout, loading }}>
      {children}
    </AdminContext.Provider>
  );
}
