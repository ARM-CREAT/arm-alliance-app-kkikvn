import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    console.log('[RootLayout] App startup initiated');

    // Hard 3-second fallback — app MUST become ready no matter what
    const hardFallback = setTimeout(() => {
      console.warn('[RootLayout] Hard 3s fallback fired — forcing appIsReady=true');
      setAppIsReady(true);
      hideSplash();
    }, 3000);

    const prepare = async () => {
      try {
        console.log('[RootLayout] Running startup tasks...');
        // All async startup work goes here wrapped in try/catch/finally
        // Currently no font/asset loading needed — providers handle their own init
      } catch (e) {
        console.warn('[RootLayout] Startup error (non-blocking):', e);
      } finally {
        console.log('[RootLayout] Startup complete — app is ready');
        clearTimeout(hardFallback);
        setAppIsReady(true);
        hideSplash();
      }
    };

    prepare();

    return () => clearTimeout(hardFallback);
  }, []);

  // Render null (not a spinner) until ready — prevents flash of unstyled content
  // but never blocks indefinitely thanks to the 3s hard fallback above
  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  // CRITICAL: Stack must ALWAYS render once ready — never gate it on external state.
  // Expo Router needs <Stack> present to initialize navigation.
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
