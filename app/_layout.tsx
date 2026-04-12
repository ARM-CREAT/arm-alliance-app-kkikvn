import { Stack, usePathname } from 'expo-router';
import { View, Platform } from 'react-native';
import React, { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { colors } from '@/styles/commonStyles';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Only prevent auto-hide on native — calling this on web can hang the preview
// waiting for a native module that never resolves.
if (Platform.OS !== 'web') {
  try { SplashScreen.preventAutoHideAsync(); } catch {}
}

// GestureHandler is native-only; use plain View on web
const GestureHandlerRootView = View;

const ARMTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

function AdminAutoLogout() {
  const pathname = usePathname();
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const wasInAdminRef = useRef(false);
  useEffect(() => {
    const isInAdmin = pathname.startsWith('/admin');
    if (wasInAdminRef.current && !isInAdmin && isAdminAuthenticated) logout();
    wasInAdminRef.current = isInAdmin;
  }, [pathname, isAdminAuthenticated, logout]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately on native — no waiting on any async work
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  const rootStyle = Platform.OS === 'web'
    ? { flex: 1, width: '100%' as const, height: '100%' as const }
    : { flex: 1 };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={rootStyle}>
        <LocalizationProvider>
          <AuthProvider>
            <NotificationProvider>
              <AdminAuthProvider>
                <WidgetProvider>
                  <ThemeProvider value={ARMTheme}>
                    <AdminAutoLogout />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="admin" options={{ headerShown: false }} />
                      <Stack.Screen name="donation" options={{ presentation: 'modal', headerShown: false }} />
                      <Stack.Screen name="ideology" options={{ headerShown: false }} />
                      <Stack.Screen name="auth" options={{ headerShown: false }} />
                      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                      <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                      <Stack.Screen name="program" options={{ headerShown: false }} />
                      <Stack.Screen name="arm-message" options={{ headerShown: false }} />
                      <Stack.Screen name="members-list" options={{ headerShown: false }} />
                      <Stack.Screen name="notification-preferences" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="contact" options={{ headerShown: false }} />
                      <Stack.Screen name="member" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </WidgetProvider>
              </AdminAuthProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
