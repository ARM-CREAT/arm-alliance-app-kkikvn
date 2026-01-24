
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from 'expo-haptics';

export default function MembershipScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [cercle, setCercle] = useState('');
  const [commune, setCommune] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('User tapped Submit Membership button');
    
    if (!name || !email || !phone || !region) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    console.log('Submitting membership:', { name, email, phone, region, cercle, commune });

    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall('/api/membership', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          region,
          cercle: cercle || undefined,
          commune: commune || undefined,
        }),
      });

      setLoading(false);

      if (error) {
        Alert.alert('Erreur', `Impossible d'envoyer votre demande: ${error}`);
        return;
      }

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Demande envoyée',
        'Votre demande d\'adhésion a été envoyée avec succès. Nous vous contactons bientôt.',
        [{ text: 'OK', onPress: () => {
          setName('');
          setEmail('');
          setPhone('');
          setRegion('');
          setCercle('');
          setCommune('');
        }}]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error submitting membership:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <IconSymbol 
          ios_icon_name="person.badge.plus.fill" 
          android_material_icon_name="person-add" 
          size={48} 
          color={colors.primary} 
        />
        <Text style={styles.title}>Adhérer au Parti</Text>
        <Text style={styles.subtitle}>
          Rejoignez l&apos;Alliance pour le Rassemblement Malien
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom complet"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+223 XX XX XX XX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Région *</Text>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="Votre région"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cercle</Text>
          <TextInput
            style={styles.input}
            value={cercle}
            onChangeText={setCercle}
            placeholder="Votre cercle (optionnel)"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commune</Text>
          <TextInput
            style={styles.input}
            value={commune}
            onChangeText={setCommune}
            placeholder="Votre commune (optionnel)"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.primary} 
          />
          <Text style={styles.infoText}>
            Votre demande sera examinée par notre équipe. Vous recevrez une confirmation par email.
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 48 : 0,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
