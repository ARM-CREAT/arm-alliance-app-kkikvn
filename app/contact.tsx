
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
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';
import { apiPost } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import { Map, MapMarker } from '@/components/Map';

export default function ContactScreen() {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'info' | 'success' | 'warning' | 'error' | 'confirm'>('info');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const showModal = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'confirm') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('User tapped Send Message button');
    
    // Validation
    if (!formData.name.trim()) {
      showModal('Erreur', 'Veuillez entrer votre nom', 'error');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      showModal('Erreur', 'Veuillez entrer votre email ou téléphone', 'error');
      return;
    }
    if (!formData.subject.trim()) {
      showModal('Erreur', 'Veuillez entrer un sujet', 'error');
      return;
    }
    if (!formData.message.trim()) {
      showModal('Erreur', 'Veuillez entrer votre message', 'error');
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      console.log('[Contact] Submitting message:', formData);
      
      const response = await apiPost('/api/messages', {
        senderName: formData.name,
        senderEmail: formData.email || 'noemail@arm-mali.org',
        subject: formData.subject,
        message: formData.message,
      });
      
      console.log('[Contact] Message sent successfully:', response);
      
      showModal(
        'Message Envoyé',
        'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
        'success'
      );
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      
    } catch (error: any) {
      console.error('[Contact] Error sending message:', error);
      showModal(
        'Erreur',
        error?.message || 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    console.log('User tapped call button:', phone);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    console.log('User tapped email button:', email);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(`mailto:${email}`);
  };

  // Mali headquarters location
  const headquarters: MapMarker = {
    id: 'hq',
    latitude: 12.6392,
    longitude: -8.0029,
    title: 'Siège A.R.M',
    description: 'Rue 530, Porte 245, Sebenikoro, Bamako',
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Contactez-nous',
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
          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de Contact</Text>
            
            <View style={styles.contactCard}>
              <View style={styles.contactItem}>
                <IconSymbol
                  ios_icon_name="building.2.fill"
                  android_material_icon_name="location-city"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Siège</Text>
                  <Text style={styles.contactValue}>Rue 530, Porte 245</Text>
                  <Text style={styles.contactValue}>Sebenikoro, Bamako, Mali</Text>
                </View>
              </View>

              <View style={styles.contactItem}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Téléphone</Text>
                  <TouchableOpacity onPress={() => handleCall('+34632607101')}>
                    <Text style={styles.contactLink}>+34 632 607 101</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCall('+22376304869')}>
                    <Text style={styles.contactLink}>+223 76 30 48 69</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.contactItem}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <TouchableOpacity onPress={() => handleEmail('contact@arm-mali.org')}>
                    <Text style={styles.contactLink}>contact@arm-mali.org</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Map */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notre Localisation</Text>
            <View style={styles.mapContainer}>
              <Map
                markers={[headquarters]}
                initialRegion={{
                  latitude: 12.6392,
                  longitude: -8.0029,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                style={styles.map}
              />
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Envoyez-nous un Message</Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom complet"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone</Text>
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
                <Text style={styles.label}>Sujet *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sujet de votre message"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.subject}
                  onChangeText={(text) => setFormData({ ...formData, subject: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Votre message..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.message}
                  onChangeText={(text) => setFormData({ ...formData, message: text })}
                  multiline
                  numberOfLines={6}
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
                  <>
                    <IconSymbol
                      ios_icon_name="paperplane.fill"
                      android_material_icon_name="send"
                      size={20}
                      color={colors.background}
                    />
                    <Text style={styles.submitButtonText}>Envoyer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  contactLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
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
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
    marginLeft: 8,
  },
});
