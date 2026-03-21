
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { apiPost } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MemberRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');
  const [registeredNumber, setRegisteredNumber] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    region: '',
    profession: '',
    motivation: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const updateField = (field: keyof typeof formData) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }));
  };

  const handleSubmit = async () => {
    console.log('[MemberRegister] User tapped S\'inscrire button');

    if (!formData.firstName.trim()) {
      showModal('Erreur', 'Veuillez entrer votre prénom', 'error');
      return;
    }
    if (!formData.lastName.trim()) {
      showModal('Erreur', 'Veuillez entrer votre nom de famille', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showModal('Erreur', 'Veuillez entrer votre numéro de téléphone', 'error');
      return;
    }
    if (!formData.city.trim()) {
      showModal('Erreur', 'Veuillez entrer votre ville', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    const payload: Record<string, string> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
    };
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.address.trim()) payload.address = formData.address.trim();
    if (formData.region.trim()) payload.region = formData.region.trim();
    if (formData.profession.trim()) payload.profession = formData.profession.trim();
    if (formData.motivation.trim()) payload.motivation = formData.motivation.trim();

    console.log('[MemberRegister] POST /api/members/register (public, no auth):', JSON.stringify(payload));

    try {
      const response = await apiPost('/api/members/register', payload);

      console.log('[MemberRegister] Registration response:', JSON.stringify(response));

      const membershipNumber =
        response?.member?.membershipNumber ||
        response?.membershipNumber ||
        response?.member?.membership_number ||
        'N/A';

      console.log('[MemberRegister] Membership number:', membershipNumber);

      await AsyncStorage.setItem('membershipNumber', membershipNumber);
      setRegisteredNumber(membershipNumber);

      showModal(
        'Inscription Réussie',
        `Votre inscription a été enregistrée avec succès!\n\nNuméro de membre: ${membershipNumber}\n\nVotre demande est en cours de validation.`,
        'success'
      );
    } catch (error: any) {
      console.error('[MemberRegister] Registration error:', error);

      const errorMessage = String(error?.message || '');

      if (errorMessage.includes('409') || errorMessage.includes('already') || errorMessage.includes('duplicate') || errorMessage.includes('existe')) {
        showModal(
          'Déjà Inscrit',
          'Ce numéro de téléphone est déjà enregistré. Si vous avez perdu votre numéro de membre, veuillez contacter l\'administrateur.',
          'info'
        );
      } else {
        showModal(
          'Erreur',
          errorMessage || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === 'success' && registeredNumber) {
      router.push('/member/card');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Inscription Militant',
          headerShown: true,
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="person.badge.plus"
              android_material_icon_name="person-add"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.headerTitle}>Devenir Militant A.R.M</Text>
            <Text style={styles.headerSubtitle}>
              Rejoignez l&apos;Alliance pour le Rassemblement Malien
            </Text>
          </View>

          <View style={styles.form}>
            {/* Row: Prénom + Nom */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.firstName}
                  onChangeText={updateField('firstName')}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de famille"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.lastName}
                  onChangeText={updateField('lastName')}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={updateField('phone')}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={updateField('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bamako"
                placeholderTextColor={colors.textSecondary}
                value={formData.city}
                onChangeText={updateField('city')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Région (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: District de Bamako"
                placeholderTextColor={colors.textSecondary}
                value={formData.region}
                onChangeText={updateField('region')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse complète"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={updateField('address')}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Enseignant, Commerçant..."
                placeholderTextColor={colors.textSecondary}
                value={formData.profession}
                onChangeText={updateField('profession')}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Motivation (Optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Pourquoi souhaitez-vous rejoindre l'A.R.M?"
                placeholderTextColor={colors.textSecondary}
                value={formData.motivation}
                onChangeText={updateField('motivation')}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Les champs marqués d&apos;un * sont obligatoires. Votre inscription sera examinée par un administrateur.
              </Text>
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
                <>
                  <Text style={styles.submitButtonText}>S&apos;inscrire</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.background}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
  },
});
