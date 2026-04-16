import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';

const C = Colors.light;

export default function TabLayoutIOS() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: 20,
          paddingTop: 8,
          height: 84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Adhésion',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
