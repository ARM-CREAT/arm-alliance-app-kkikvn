import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WidgetProvider } from '@/contexts/WidgetContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] App startup');
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <NotificationProvider>
              <WidgetProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </WidgetProvider>
            </NotificationProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
