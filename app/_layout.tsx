import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] Mounting — hiding splash screen immediately');
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LocalizationProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <NotificationProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </NotificationProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </LocalizationProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
