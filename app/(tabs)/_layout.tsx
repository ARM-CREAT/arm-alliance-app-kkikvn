import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

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

function renderTabBar(_props: BottomTabBarProps) {
  return <FloatingTabBar tabs={TABS} />;
}

export default function TabLayout() {
  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="profile" options={{ title: 'Adhésion' }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="profile" options={{ title: 'Adhésion' }} />
    </Tabs>
  );
}
