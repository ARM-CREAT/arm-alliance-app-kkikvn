import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { colors } from '@/styles/commonStyles';

function AdminGuard() {
  const { isAdminAuthenticated, isChecking, logout } = useAdminAuth();
  const router = useRouter();
  const segments = useSegments();
  const didMountRef = useRef(false);

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

// AdminAuthProvider is already mounted in the root _layout.tsx.
// This layout just adds the route guard on top of it.
export default function AdminLayout() {
  return <AdminGuard />;
}
