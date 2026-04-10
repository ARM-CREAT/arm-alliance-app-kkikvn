/**
 * Notification Context — native (iOS/Android)
 *
 * No-op implementation. Push notifications require a custom dev build.
 * This stub keeps the app working in Expo Go without any native modules.
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[Notifications] requestPermission called (no-op — native build required)");
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
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
