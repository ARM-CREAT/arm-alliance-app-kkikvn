
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function AdminLoginScreen() {
  const router = useRouter();
  
  // Redirect to the Better Auth screen
  React.useEffect(() => {
    router.replace('/auth');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.redirectText}>Redirection vers la connexion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redirectText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
