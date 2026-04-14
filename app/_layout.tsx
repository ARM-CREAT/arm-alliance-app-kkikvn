import { Stack, usePathname } from 'expo-router';
import { View, Platform } from 'react-native';
import React, { useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

// GestureHandlerRootView must wrap the entire app on Android/iOS.
// On web, use plain View (react-native-gesture-handler is not available).
let GestureHandlerRootView: React.ComponentType<{ style?: object; children?: React.ReactNode }> = View;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
  } catch {
    GestureHandlerRootView = View;
  }
}

function AdminAutoLogout() {
  const pathname = usePathname();
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const wasInAdminRef = useRef(false);
  useEffect(() => {
    const isInAdmin = pathname.startsWith('/admin');
    if (wasInAdminRef.current && !isInAdmin && isAdminAuthenticated) {
      console.log('[AdminAutoLogout] Left admin area — logging out');
      logout();
    }
    wasInAdminRef.current = isInAdmin;
  }, [pathname, isAdminAuthenticated, logout]);
  return null;
}

export default function RootLayout() {
  // Hide splash immediately — never block render
  useEffect(() => {
    console.log('[RootLayout] Hiding splash screen');
    // SplashScreen.hide() is the legacy API; hideAsync() is the SDK 54 API.
    // Call both so the splash is dismissed regardless of which one is active.
    try { (SplashScreen as any).hide?.(); } catch { /* ignore */ }
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const rootStyle = Platform.OS === 'web'
    ? { flex: 1, width: '100%' as const, height: '100%' as const }
    : { flex: 1 };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={rootStyle}>
        <SafeAreaProvider>
          <LocalizationProvider>
            <AuthProvider>
              <NotificationProvider>
                <AdminAuthProvider>
                  <WidgetProvider>
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
                      <Stack.Screen name="members-list" options={{ headerShown: false }} />
                      <Stack.Screen name="notification-preferences" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="contact" options={{ headerShown: false }} />
                      <Stack.Screen name="member" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" />
                  </WidgetProvider>
                </AdminAuthProvider>
              </NotificationProvider>
            </AuthProvider>
          </LocalizationProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
