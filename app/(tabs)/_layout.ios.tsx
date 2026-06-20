import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ARM_GREEN = '#1B7A3E';
const ARM_YELLOW = '#F5C518';
const GREY = '#9CA3AF';
const WHITE = '#FFFFFF';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ARM_GREEN,
        tabBarInactiveTintColor: GREY,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 3,
          borderTopColor: ARM_YELLOW,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
