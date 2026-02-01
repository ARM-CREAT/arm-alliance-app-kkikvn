
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiCall, adminApiCall } from '@/utils/api';

interface Admin {
  id: string;
  username: string;
}

interface AdminContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string, secretCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyStoredToken = useCallback(async (storedToken: string): Promise<boolean> => {
    // TODO: Backend Integration - POST /api/admin/verify with Authorization header
    const { data, error } = await adminApiCall<{ valid: boolean; admin: Admin }>(
      '/api/admin/verify',
      storedToken,
      { method: 'POST', body: JSON.stringify({}) }
    );

    if (data && data.valid) {
      setAdmin(data.admin);
      return true;
    }
    return false;
  }, []);

  const loadStoredToken = useCallback(async () => {
    try {
      console.log('[AdminContext] Loading stored token');
      const storedToken = await SecureStore.getItemAsync('admin_token');
      if (storedToken) {
        setToken(storedToken);
        const isValid = await verifyStoredToken(storedToken);
        if (!isValid) {
          await SecureStore.deleteItemAsync('admin_token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('[AdminContext] Error loading token:', error);
    } finally {
      setIsLoading(false);
    }
  }, [verifyStoredToken]);

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

  const login = async (
    username: string,
    password: string,
    secretCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AdminContext] Attempting login for:', username);
      
      // TODO: Backend Integration - POST /api/admin/login with { username, password, secretCode }
      const { data, error } = await apiCall<{ success: boolean; token: string; admin: Admin; error?: string }>(
        '/api/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password, secretCode }),
        }
      );

      if (error) {
        return { success: false, error };
      }

      if (data && data.success && data.token) {
        await SecureStore.setItemAsync('admin_token', data.token);
        setToken(data.token);
        setAdmin(data.admin);
        console.log('[AdminContext] Login successful');
        return { success: true };
      }

      return { success: false, error: data?.error || 'Échec de la connexion' };
    } catch (error) {
      console.error('[AdminContext] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  };

  const logout = async () => {
    try {
      console.log('[AdminContext] Logging out');
      await SecureStore.deleteItemAsync('admin_token');
      setToken(null);
      setAdmin(null);
    } catch (error) {
      console.error('[AdminContext] Logout error:', error);
    }
  };

  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false;
    return verifyStoredToken(token);
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login,
        logout,
        verifyToken,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
