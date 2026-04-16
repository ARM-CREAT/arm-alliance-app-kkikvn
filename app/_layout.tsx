import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Hide splash screen as soon as possible — do not block on it
let splashHidden = false;
function hideSplash() {
  if (splashHidden) return;
  splashHidden = true;
  try {
    // Dynamic require so a missing module never crashes the layout
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SplashScreen = require('expo-splash-screen');
    SplashScreen.hideAsync().catch(() => {});
  } catch {}
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash after 300ms — never block on async work
    const timer = setTimeout(hideSplash, 300);
    return () => clearTimeout(timer);
  }, []);

  // CRITICAL: Stack must ALWAYS render on first mount — never gate it.
  // Expo Router needs <Stack> present immediately to initialize navigation.
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
