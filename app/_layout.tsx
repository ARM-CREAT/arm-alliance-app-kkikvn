import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { colors } from '@/styles/commonStyles';

try { SplashScreen.preventAutoHideAsync(); } catch {}

let GestureHandlerRootView: any = View;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
  } catch {}
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

export default function RootLayout() {
  const [ready, setReady] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LocalizationProvider>
          <AuthProvider>
            <NotificationProvider>
              <AdminAuthProvider>
                <WidgetProvider>
                  <ThemeProvider value={ARMTheme}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="donation" options={{ presentation: 'modal', headerShown: false }} />
                      <Stack.Screen name="member/register" options={{ headerShown: false }} />
                      <Stack.Screen name="member/success" options={{ headerShown: false }} />
                      <Stack.Screen name="member/card" options={{ headerShown: false }} />
                      <Stack.Screen name="member/cotisation" options={{ headerShown: false }} />
                      <Stack.Screen name="member/messages" options={{ headerShown: false }} />
                      <Stack.Screen name="member/election-results" options={{ headerShown: false }} />
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
                    </Stack>
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </WidgetProvider>
              </AdminAuthProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
