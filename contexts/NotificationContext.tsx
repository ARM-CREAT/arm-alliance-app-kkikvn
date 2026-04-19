import React, { createContext, useContext } from 'react';

interface NotificationContextType {
  hasPermission: boolean;
  permissionDenied: boolean;
  loading: boolean;
  isWeb: boolean;
  requestPermission: () => Promise<boolean>;
  sendTag: (key: string, value: string) => void;
  deleteTag: (key: string) => void;
  lastNotification: Record<string, unknown> | null;
}

const defaultValue: NotificationContextType = {
  hasPermission: false,
  permissionDenied: false,
  loading: false,
  isWeb: true,
  requestPermission: async () => false,
  sendTag: () => {},
  deleteTag: () => {},
  lastNotification: null,
};

const NotificationContext = createContext<NotificationContextType>(defaultValue);

export function useNotification() {
  return useContext(NotificationContext);
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationContext.Provider value={defaultValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
