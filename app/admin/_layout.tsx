import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

function AdminGuard() {
  const { isAdminAuthenticated, isChecking } = useAdminAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Only apply guards when we are actually inside the admin section.
    // If the user navigated away from /admin entirely, do nothing — the
    // root-level AdminAutoLogout component handles the logout there.
    const isInAdmin = segments[0] === 'admin';
    if (!isInAdmin) return;

    if (!isChecking) {
      const isOnLoginScreen = segments.includes('login' as never);

      if (!isAdminAuthenticated && !isOnLoginScreen) {
        console.log('[AdminGuard] Non authentifié, redirection vers login');
        router.replace('/admin/login');
      } else if (isAdminAuthenticated && isOnLoginScreen) {
        console.log('[AdminGuard] Déjà authentifié, redirection vers dashboard');
        router.replace('/admin/dashboard');
      }
    }
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
