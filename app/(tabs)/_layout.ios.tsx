import React from 'react';
import { Tabs } from 'expo-router';
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
