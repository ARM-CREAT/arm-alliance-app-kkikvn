import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { colors } from '@/styles/commonStyles';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// On native: prevent auto-hide so we can control when it disappears.
// On web: skip entirely — SplashScreen is a no-op on web and calling it
// can cause the preview to hang waiting for a native module that never resolves.
if (typeof navigator === 'undefined' || navigator.product !== 'ReactNative') {
  // web — do nothing
} else {
  try { SplashScreen.preventAutoHideAsync(); } catch {}
}

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
    // Hide splash screen as soon as the layout mounts — no waiting
    SplashScreen.hideAsync().catch(() => {});
    console.log('[RootLayout] mounted, splash hidden');
  }, []);

  // Render children immediately — no loading gate here.
  // Each context provider handles its own async init non-blockingly.
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LocalizationProvider>
          <AuthProvider>
            <NotificationProvider>
              <AdminAuthProvider>
                <WidgetProvider>
                  <ThemeProvider value={ARMTheme}>
                    <AdminAutoLogout />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="donation" options={{ presentation: 'modal', headerShown: false }} />
                      <Stack.Screen name="member/register" options={{ headerShown: false }} />
                      <Stack.Screen name="member/success" options={{ headerShown: false }} />
                      <Stack.Screen name="member/card" options={{ headerShown: false }} />
                      <Stack.Screen name="member/cotisation" options={{ headerShown: false }} />
                      <Stack.Screen name="member/messages" options={{ headerShown: false }} />
                      <Stack.Screen name="member/election-results" options={{ headerShown: false }} />
                      <Stack.Screen name="member/recover" options={{ headerShown: false }} />
                      <Stack.Screen name="ideology" options={{ headerShown: false }} />
                      <Stack.Screen name="auth" options={{ headerShown: false }} />
                      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                      <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/login" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/leadership" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/membership-stats" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/offline-access" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/quick-setup" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/memberships" options={{ headerShown: false }} />
                      <Stack.Screen name="program" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/conferences" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/contacts" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/program" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/app-settings" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/index" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/announcements" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/announcements/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/political-messages" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/political-messages/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="admin/stats" options={{ headerShown: false }} />
                      <Stack.Screen name="arm-message" options={{ headerShown: false }} />
                      <Stack.Screen name="members-list" options={{ headerShown: false }} />
                      <Stack.Screen name="notification-preferences" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="contact" options={{ headerShown: false }} />
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
