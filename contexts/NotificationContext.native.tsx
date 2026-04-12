/**
 * Notification Context — native (iOS/Android)
 *
 * No-op implementation. Push notifications require a custom dev build.
 * This stub keeps the app working in Expo Go without any native modules.
 * Interface matches NotificationContext.tsx exactly so both platforms are compatible.
 */

import React, { createContext, useContext, useCallback, ReactNode } from "react";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

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

const NotificationContext = createContext<NotificationContextType>({
  hasPermission: false,
  permissionDenied: false,
  loading: false,
  isWeb,
  requestPermission: async () => false,
  sendTag: () => {},
  deleteTag: () => {},
  lastNotification: null,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const sendTag = useCallback((_key: string, _value: string) => {}, []);
  const deleteTag = useCallback((_key: string) => {}, []);

  return (
    <NotificationContext.Provider
      value={{
        hasPermission: false,
        permissionDenied: false,
        loading: false,
        isWeb,
        requestPermission,
        sendTag,
        deleteTag,
        lastNotification: null,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export default NotificationContext;
