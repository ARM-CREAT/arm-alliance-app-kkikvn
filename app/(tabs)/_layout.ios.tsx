
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

const TABS: TabBarItem[] = [
  {
    name: 'index',
    route: '/(tabs)',
    icon: 'home',
    label: 'Accueil',
  },
  {
    name: 'profile',
    route: '/(tabs)/profile',
    icon: 'person',
    label: 'Adhésion',
  },
];

export default function TabLayout() {
  return (
    <View style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={TABS} />
    </View>
  );
}
