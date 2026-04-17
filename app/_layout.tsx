import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Hide splash screen immediately — never block rendering on it
let splashHidden = false;
function hideSplash() {
  if (splashHidden) return;
  splashHidden = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SplashScreen = require('expo-splash-screen');
    SplashScreen.hideAsync().catch(() => {});
  } catch {}
}

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] App startup');
    hideSplash();
  }, []);

  return (
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
  );
}
