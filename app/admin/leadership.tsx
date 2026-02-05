
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
});

export default function AdminLeadershipScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gestion de la Direction',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <Text style={styles.text}>
          Gestion de la direction - Fonctionnalité similaire aux actualités
        </Text>
      </View>
    </>
  );
}
