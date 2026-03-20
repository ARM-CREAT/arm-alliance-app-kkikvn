
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function CallScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Appels Audio',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <IconSymbol
          ios_icon_name="phone.slash.fill"
          android_material_icon_name="phone-disabled"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.title}>Fonctionnalité non disponible</Text>
        <Text style={styles.subtitle}>
          Les appels audio ne sont pas disponibles pour le moment.
          Veuillez utiliser les conférences vidéo pour communiquer.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
