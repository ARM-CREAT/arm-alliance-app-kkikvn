
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import React, { useEffect, useState } from "react";
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
import { AuthProvider } from "@/contexts/AuthContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { useFonts } from "expo-font";
import { colors } from "@/styles/commonStyles";
import { Modal } from "@/components/ui/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isConnected === false) {
      setShowNetworkModal(true);
    } else {
      setShowNetworkModal(false);
    }
  }, [isConnected]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LocalizationProvider>
          <AuthProvider>
            <WidgetProvider>
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
                    name="settings" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="ideology" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="program" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="ai-chat" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="auth" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="auth-callback" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="auth-popup" 
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
                    name="admin/news" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="admin/events" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="admin/leadership" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="admin/media" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="admin/members" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="admin/program" 
                    options={{ 
                      headerShown: false,
                    }} 
                  />
                </Stack>
                <StatusBar style="auto" />
                
                {/* Network Status Modal */}
                <Modal
                  visible={showNetworkModal}
                  title="Pas de connexion Internet"
                  message="Veuillez vérifier votre connexion Internet pour utiliser l'application."
                  type="warning"
                  onClose={() => setShowNetworkModal(false)}
                />
              </ThemeProvider>
            </WidgetProvider>
          </AuthProvider>
        </LocalizationProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
