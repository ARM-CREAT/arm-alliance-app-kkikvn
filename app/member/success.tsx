import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const C = Colors.light;

export default function MemberSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    member_number: string;
    full_name: string;
  }>();

  const memberNumber = params.member_number ?? '';
  const fullName = params.full_name ?? '';
  const welcomeText = fullName ? `Bienvenue, ${fullName} !` : 'Bienvenue !';

  const handleGoHome = () => {
    console.log('[MemberSuccess] Bouton "Retour à l\'accueil" appuyé');
    router.dismissAll();
    router.replace('/(tabs)/(home)');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Adhésion confirmée',
          headerShown: true,
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Green checkmark circle */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={56} color="#fff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Adhésion confirmée !</Text>

        {/* Welcome */}
        <Text style={styles.welcome}>{welcomeText}</Text>

        {/* Member number box */}
        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>Votre numéro d'adhérent</Text>
          <Text style={styles.memberNumber}>{memberNumber}</Text>
        </View>

        {/* Save note */}
        <View style={styles.noteRow}>
          <Ionicons name="information-circle" size={18} color={C.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.noteText}>Conservez ce numéro précieusement. Il vous permettra de retrouver votre carte d'adhérent.</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Go home button */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 48,
  },
  checkCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  welcome: {
    fontSize: 17,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  numberBox: {
    backgroundColor: C.primaryMuted,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: C.primary + '40',
    marginBottom: 20,
  },
  numberLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  memberNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: C.divider,
    marginBottom: 32,
  },
  homeButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
