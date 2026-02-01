
import { Stack } from "expo-router";
import { useColorScheme, Alert } from "react-native";
import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useNetworkState } from "expo-network";
import { SystemBars } from "react-native-edge-to-edge";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { useFonts } from "expo-font";
import { colors } from "@/styles/commonStyles";

SplashScreen.preventAutoHideAsync();

// Custom light theme for A.R.M
const ARMTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const colorScheme = useColorScheme();
  const { isConnected } = useNetworkState();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isConnected === false) {
      Alert.alert(
        "Pas de connexion Internet",
        "Veuillez vérifier votre connexion Internet pour utiliser l'application."
      );
    }
  }, [isConnected]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <AuthProvider>
          <WidgetProvider>
            <AdminProvider>
              <ThemeProvider value={ARMTheme}>
            <SystemBars style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="contact" 
                options={{ 
                  presentation: "modal",
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="donation" 
                options={{ 
                  presentation: "modal",
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="chat/public" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="admin/login" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="admin/dashboard" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="member/register" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="member/card" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="member/cotisation" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="member/messages" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="member/election-results" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="admin/manage-members" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="admin/send-message" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="admin/election-verification" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="conferences" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="settings" 
                options={{ 
                  headerShown: false,
                }} 
              />
            </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </AdminProvider>
        </WidgetProvider>
      </AuthProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
