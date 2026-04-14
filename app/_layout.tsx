import { Stack, usePathname } from 'expo-router';
import { View, Platform } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { colors } from '@/styles/commonStyles';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent splash from auto-hiding — guarded against web
try {
  SplashScreen.preventAutoHideAsync();
} catch {}

// GestureHandlerRootView must wrap the entire app on Android/iOS.
// On web, use plain View (react-native-gesture-handler is not available).
let GestureHandlerRootView: React.ComponentType<{ style?: any; children?: React.ReactNode }> = View;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
  } catch {
    GestureHandlerRootView = View;
  }
}

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
  // Hard-render gate: after 3s we force-render regardless of font state
  const [forceReady, setForceReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'SpaceMono-Bold': require('../assets/fonts/SpaceMono-Bold.ttf'),
    'SpaceMono-Italic': require('../assets/fonts/SpaceMono-Italic.ttf'),
    'SpaceMono-BoldItalic': require('../assets/fonts/SpaceMono-BoldItalic.ttf'),
  });

  // Hide splash once fonts are ready (or failed) — never block indefinitely
  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('[RootLayout] Fonts ready, hiding splash screen');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Absolute safety timeout: force render + hide splash after 3 seconds no matter what.
  // This guarantees the app is always visible even if useFonts hangs on Android.
  useEffect(() => {
    const t = setTimeout(() => {
      console.log('[RootLayout] 3s timeout — forcing app render');
      setForceReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // CRITICAL: NEVER return null here.
  // On Android, useFonts can hang indefinitely causing a permanent blank white screen.
  // The app must always render immediately. Fonts load in the background.
  // We only gate on forceReady to ensure the 3s timeout always fires.
  const isReady = fontsLoaded || fontError || forceReady;
  if (!isReady) {
    // Render a transparent placeholder — splash screen is still visible on top
    return <View style={{ flex: 1 }} />;
  }

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
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
