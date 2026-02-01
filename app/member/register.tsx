
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

export default function MemberRegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const [formData, setFormData] = useState({
    fullName: '',
    nina: '',
    commune: '',
    profession: '',
    phone: '',
    email: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('User tapped Register Member button');
    
    // Validation
    if (!formData.fullName.trim()) {
      showModal('Erreur', 'Veuillez entrer votre nom complet', 'error');
      return;
    }
    if (!formData.commune.trim()) {
      showModal('Erreur', 'Veuillez entrer votre commune de résidence', 'error');
      return;
    }
    if (!formData.profession.trim()) {
      showModal('Erreur', 'Veuillez entrer votre profession', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showModal('Erreur', 'Veuillez entrer votre numéro de téléphone', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const { apiPost } = await import('@/utils/api');
      
      console.log('[MemberRegister] Submitting member registration:', formData);
      
      const response = await apiPost('/api/members/register', {
        fullName: formData.fullName,
        nina: formData.nina || undefined,
        commune: formData.commune,
        profession: formData.profession,
        phone: formData.phone,
        email: formData.email || undefined,
      });
      
      console.log('[MemberRegister] Registration successful:', response);
      
      showModal(
        'Inscription Réussie',
        `Votre inscription a été enregistrée avec succès!\n\nNuméro de membre: ${response.membershipNumber}\n\nVous pouvez maintenant accéder à votre carte de membre.`,
        'success'
      );
      
      // Navigate to member card after success
      setTimeout(() => {
        router.push('/member/card');
      }, 2000);
      
    } catch (error: any) {
      console.error('[MemberRegister] Registration error:', error);
      showModal(
        'Erreur',
        error?.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Inscription Militant',
          headerShown: true,
          headerBackTitle: 'Retour',
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom Complet *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre nom complet"
                placeholderTextColor={colors.textSecondary}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NINA (Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro d'identification national"
                placeholderTextColor={colors.textSecondary}
                value={formData.nina}
                onChangeText={(text) => setFormData({ ...formData, nina: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Commune de Résidence *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre commune"
                placeholderTextColor={colors.textSecondary}
                value={formData.commune}
                onChangeText={(text) => setFormData({ ...formData, commune: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre profession"
                placeholderTextColor={colors.textSecondary}
                value={formData.profession}
                onChangeText={(text) => setFormData({ ...formData, profession: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+223 XX XX XX XX"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
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
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
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
                Les champs marqués d&apos;un * sont obligatoires
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
        onClose={() => setModalVisible(false)}
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
    paddingTop: Platform.OS === 'android' ? 16 : 0,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
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
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginRight: 8,
  },
});
