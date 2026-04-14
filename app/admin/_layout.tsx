import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

function AdminGuard() {
  const { isAdminAuthenticated, isChecking } = useAdminAuth();
  const router = useRouter();
  const segments = useSegments();
  // Debounce redirects so stale segment values during navigation transitions
  // don't trigger spurious redirects.
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only apply guards when we are actually inside the admin section.
    // If the user navigated away from /admin entirely, do nothing — the
    // root-level AdminAutoLogout component handles the logout there.
    const isInAdmin = segments[0] === 'admin';
    if (!isInAdmin) return;

    if (isChecking) return;

    // Cancel any pending redirect from a previous render
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    const isOnLoginScreen = segments.includes('login' as never);

    if (!isAdminAuthenticated && !isOnLoginScreen) {
      // Debounce by one tick so segments are stable before redirecting
      redirectTimerRef.current = setTimeout(() => {
        console.log('[AdminGuard] Non authentifié, redirection vers login');
        router.replace('/admin/login');
      }, 50);
    } else if (isAdminAuthenticated && isOnLoginScreen) {
      redirectTimerRef.current = setTimeout(() => {
        console.log('[AdminGuard] Déjà authentifié, redirection vers dashboard');
        router.replace('/admin/dashboard');
      }, 50);
    }

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [isAdminAuthenticated, isChecking, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

// AdminAuthProvider is already mounted in the root _layout.tsx.
// This layout just adds the route guard on top of it.
export default function AdminLayout() {
  return <AdminGuard />;
}
