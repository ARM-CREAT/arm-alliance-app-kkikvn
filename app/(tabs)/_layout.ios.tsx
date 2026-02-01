
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Accueil</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Adhésion</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
