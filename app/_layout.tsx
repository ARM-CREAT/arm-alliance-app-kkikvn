import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WidgetProvider } from '@/contexts/WidgetContext';

// ---------------------------------------------------------------------------
// Splash screen — hide immediately and unconditionally after 3 s max.
// Never block rendering on splash state.
// ---------------------------------------------------------------------------
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

// Hard fallback: hide splash after 3 s no matter what
setTimeout(hideSplash, 3000);

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] App startup');
    // Hide splash immediately on mount — do not wait for any async work
    hideSplash();

    // Initialize error logging AFTER React has mounted so console overrides
    // don't interfere with the initial render cycle.
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { setupErrorLogging } = require('@/utils/errorLogger');
        setupErrorLogging();
      } catch (e) {
        // Non-fatal — app still works without error logging
        console.warn('[RootLayout] setupErrorLogging failed (non-blocking):', e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // IMPORTANT: Never return null or a loading spinner here.
  // Always render children immediately so the app is never stuck on a blank screen.
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
