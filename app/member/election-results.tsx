
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
import { authenticatedPost } from '@/utils/api';
import * as Haptics from 'expo-haptics';

export default function ElectionResultsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const [formData, setFormData] = useState({
    electionType: '',
    region: '',
    cercle: '',
    commune: '',
    bureauVote: '',
    candidat1Votes: '',
    candidat2Votes: '',
    candidat3Votes: '',
    votesNuls: '',
    pvPhotoUrl: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('[ElectionResults] User tapped Submit button');
    
    // Validation
    if (!formData.electionType.trim()) {
      showModal('Erreur', 'Veuillez entrer le type d\'élection', 'error');
      return;
    }
    if (!formData.region.trim()) {
      showModal('Erreur', 'Veuillez entrer la région', 'error');
      return;
    }
    if (!formData.cercle.trim()) {
      showModal('Erreur', 'Veuillez entrer le cercle', 'error');
      return;
    }
    if (!formData.commune.trim()) {
      showModal('Erreur', 'Veuillez entrer la commune', 'error');
      return;
    }
    if (!formData.bureauVote.trim()) {
      showModal('Erreur', 'Veuillez entrer le bureau de vote', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      console.log('[ElectionResults] Submitting election results:', formData);
      
      // Prepare results data
      const resultsData = {
        candidat1: parseInt(formData.candidat1Votes) || 0,
        candidat2: parseInt(formData.candidat2Votes) || 0,
        candidat3: parseInt(formData.candidat3Votes) || 0,
        votesNuls: parseInt(formData.votesNuls) || 0,
      };

      const response = await authenticatedPost('/api/elections/submit-results', {
        electionType: formData.electionType,
        region: formData.region,
        cercle: formData.cercle,
        commune: formData.commune,
        bureauVote: formData.bureauVote,
        resultsData,
        pvPhotoUrl: formData.pvPhotoUrl || undefined,
      });
      
      console.log('[ElectionResults] Submission successful:', response);
      
      showModal(
        'Soumission Réussie',
        `Vos résultats ont été soumis avec succès!\n\nID: ${response.resultId}\nStatut: ${response.status}\n\nIls seront vérifiés par l'administration.`,
        'success'
      );
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          electionType: '',
          region: '',
          cercle: '',
          commune: '',
          bureauVote: '',
          candidat1Votes: '',
          candidat2Votes: '',
          candidat3Votes: '',
          votesNuls: '',
          pvPhotoUrl: '',
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('[ElectionResults] Submission error:', error);
      showModal(
        'Erreur',
        error?.message || 'Une erreur est survenue lors de la soumission. Veuillez réessayer.',
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
          title: 'Module Sentinelle',
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
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.headerTitle}>Soumettre Résultats Électoraux</Text>
            <Text style={styles.headerSubtitle}>
              Module de surveillance électorale
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type d&apos;Élection *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Présidentielle 2025"
                placeholderTextColor={colors.textSecondary}
                value={formData.electionType}
                onChangeText={(text) => setFormData({ ...formData, electionType: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Région *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez la région"
                placeholderTextColor={colors.textSecondary}
                value={formData.region}
                onChangeText={(text) => setFormData({ ...formData, region: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cercle *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez le cercle"
                placeholderTextColor={colors.textSecondary}
                value={formData.cercle}
                onChangeText={(text) => setFormData({ ...formData, cercle: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Commune *</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez la commune"
                placeholderTextColor={colors.textSecondary}
                value={formData.commune}
                onChangeText={(text) => setFormData({ ...formData, commune: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bureau de Vote *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bureau n°1"
                placeholderTextColor={colors.textSecondary}
                value={formData.bureauVote}
                onChangeText={(text) => setFormData({ ...formData, bureauVote: text })}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Résultats</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Candidat 1 - Votes</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de votes"
                placeholderTextColor={colors.textSecondary}
                value={formData.candidat1Votes}
                onChangeText={(text) => setFormData({ ...formData, candidat1Votes: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Candidat 2 - Votes</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de votes"
                placeholderTextColor={colors.textSecondary}
                value={formData.candidat2Votes}
                onChangeText={(text) => setFormData({ ...formData, candidat2Votes: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Candidat 3 - Votes</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de votes"
                placeholderTextColor={colors.textSecondary}
                value={formData.candidat3Votes}
                onChangeText={(text) => setFormData({ ...formData, candidat3Votes: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votes Nuls</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de votes nuls"
                placeholderTextColor={colors.textSecondary}
                value={formData.votesNuls}
                onChangeText={(text) => setFormData({ ...formData, votesNuls: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo du PV (URL - Optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={formData.pvPhotoUrl}
                onChangeText={(text) => setFormData({ ...formData, pvPhotoUrl: text })}
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
                Les résultats soumis seront vérifiés par l&apos;administration avant publication
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
                  <Text style={styles.submitButtonText}>Soumettre</Text>
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
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
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
