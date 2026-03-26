import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';

const ADMIN_AUTH_KEY = 'admin_authenticated';

export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AdminLayout] Vérification authentification admin...');
      try {
        const flag = await AsyncStorage.getItem(ADMIN_AUTH_KEY);
        console.log('[AdminLayout] admin_authenticated:', flag);
        const isOnLoginScreen = segments.includes('login' as never);

        if (flag !== 'true' && !isOnLoginScreen) {
          console.log('[AdminLayout] Non authentifié, redirection vers login');
          router.replace('/admin/login');
        } else {
          console.log('[AdminLayout] Authentifié ou déjà sur login, accès autorisé');
        }
      } catch (err) {
        console.error('[AdminLayout] Erreur lecture AsyncStorage:', err);
        router.replace('/admin/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) {
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
