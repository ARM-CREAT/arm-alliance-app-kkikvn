import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('[RootLayout] Mounting — starting global load timeout');

    // Global safety net: force-show the app after 5 seconds no matter what
    const globalTimeout = setTimeout(() => {
      console.warn('[RootLayout] Global 5s timeout fired — forcing app visible');
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);

    // Hide splash immediately and mark ready
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        clearTimeout(globalTimeout);
        setReady(true);
      });

    return () => clearTimeout(globalTimeout);
  }, []);

  if (!ready) return null;

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
