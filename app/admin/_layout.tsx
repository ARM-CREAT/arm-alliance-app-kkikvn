import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { colors } from '@/styles/commonStyles';

function AdminGuard() {
  const { isAdminAuthenticated, isChecking, logout } = useAdminAuth();
  const router = useRouter();
  const segments = useSegments();
  const didMountRef = useRef(false);

  // On every render, check if we are still inside the admin section.
  // If the user navigated outside /admin/* while the layout is still mounted,
  // auto-logout so they must re-authenticate next time.
  useEffect(() => {
    const isInAdmin = segments[0] === 'admin';

    if (!isInAdmin && didMountRef.current) {
      console.log('[AdminGuard] Utilisateur a quitté la section admin — déconnexion automatique');
      logout();
      return;
    }

    if (!isChecking) {
      const isOnLoginScreen = segments.includes('login' as never);

      if (!isAdminAuthenticated && !isOnLoginScreen) {
        console.log('[AdminGuard] Non authentifié, redirection vers login');
        router.replace('/admin/login');
      } else if (isAdminAuthenticated && isOnLoginScreen) {
        console.log('[AdminGuard] Déjà authentifié, redirection vers dashboard');
        router.replace('/admin');
      }
    }

    didMountRef.current = true;
  }, [isAdminAuthenticated, isChecking, segments, logout, router]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminGuard />
    </AdminAuthProvider>
  );
}
