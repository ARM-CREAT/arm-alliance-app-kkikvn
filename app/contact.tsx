
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { apiPost } from '@/utils/api';

const CONTACT_INFO = [
  { icon: '📍', label: 'Adresse', value: 'Bamako, Mali' },
  { icon: '📞', label: 'Téléphone', value: '+223 XX XX XX XX', action: 'tel:+22300000000' },
  { icon: '✉️', label: 'Email', value: 'contact@alliance-arm.ml', action: 'mailto:contact@alliance-arm.ml' },
  { icon: '🌐', label: 'Site web', value: 'www.alliance-arm.ml', action: 'https://www.alliance-arm.ml' },
];

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleContactPress = (action?: string) => {
    if (!action) return;
    console.log('[Contact] Lien de contact appuyé:', action);
    Linking.openURL(action).catch((err) => {
      console.error('[Contact] Erreur ouverture lien:', err);
    });
  };

  const handleSubmit = async () => {
    console.log('[Contact] Bouton Envoyer le message appuyé');
    setError('');

    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }
    if (!message.trim()) {
      setError('Veuillez entrer votre message');
      return;
    }

    setLoading(true);
    console.log('[Contact] POST /api/contact', { name, email, subject, message });

    try {
      await apiPost('/api/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || 'Contact depuis l\'application',
        message: message.trim(),
      });
      console.log('[Contact] Message envoyé avec succès');
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('[Contact] Erreur envoi message:', err.message);
      setError(err.message || 'Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contact',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: 'Retour',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📬</Text>
          <Text style={styles.headerTitle}>Contactez-nous</Text>
          <Text style={styles.headerSubtitle}>
            L'Alliance pour le Rassemblement Malien est à votre écoute
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos coordonnées</Text>
          <View style={styles.card}>
            {CONTACT_INFO.map((item, index) => {
              const isLast = index === CONTACT_INFO.length - 1;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.contactRow, !isLast && styles.contactRowBorder]}
                  onPress={() => handleContactPress(item.action)}
                  activeOpacity={item.action ? 0.7 : 1}
                  disabled={!item.action}
                >
                  <Text style={styles.contactIcon}>{item.icon}</Text>
                  <View style={styles.contactTextBlock}>
                    <Text style={styles.contactLabel}>{item.label}</Text>
                    <Text style={[styles.contactValue, item.action && styles.contactValueLink]}>
                      {item.value}
                    </Text>
                  </View>
                  {item.action && <Text style={styles.chevron}>›</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Envoyer un message</Text>

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Message envoyé !</Text>
              <Text style={styles.successText}>
                Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
              </Text>
              <TouchableOpacity
                style={styles.newMessageBtn}
                onPress={() => {
                  console.log('[Contact] Bouton Nouveau message appuyé');
                  setSent(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.newMessageBtnText}>Envoyer un autre message</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre nom"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
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
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sujet</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Objet de votre message"
                  placeholderTextColor={colors.textTertiary}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Écrivez votre message ici..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Envoyer le message</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  contactTextBlock: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  contactValueLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  newMessageBtn: {
    marginTop: 8,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newMessageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomSpacer: {
    height: 20,
  },
});
