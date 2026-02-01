
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function ContactScreen() {
  const router = useRouter();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('User tapped Send Message button');
    
    if (!senderName || !senderEmail || !subject || !message) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    console.log('Sending message:', { senderName, senderEmail, subject, message });

    try {
      const { apiCall } = await import('@/utils/api');
      const { data, error } = await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderName,
          senderEmail,
          subject,
          message,
        }),
      });

      setLoading(false);

      if (error) {
        Alert.alert('Erreur', `Impossible d'envoyer votre message: ${error}`);
        return;
      }

      Alert.alert(
        'Message envoyé',
        'Votre message a été envoyé avec succès. Nous vous répondrons bientôt.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Contactez-nous',
        headerBackTitle: 'Retour',
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="envelope.fill" 
            android_material_icon_name="email" 
            size={48} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Contactez-nous</Text>
          <Text style={styles.subtitle}>
            Envoyez-nous un message, nous vous répondrons rapidement
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Votre nom</Text>
            <TextInput
              style={styles.input}
              value={senderName}
              onChangeText={setSenderName}
              placeholder="Nom complet"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Votre email</Text>
            <TextInput
              style={styles.input}
              value={senderEmail}
              onChangeText={setSenderEmail}
              placeholder="votre@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sujet</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Sujet de votre message"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Écrivez votre message ici..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Envoi en cours...' : 'Envoyer le message'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Autres moyens de contact</Text>
          
          <View style={styles.contactItem}>
            <IconSymbol 
              ios_icon_name="building.2.fill" 
              android_material_icon_name="location-city" 
              size={24} 
              color={colors.primary} 
            />
            <View style={styles.contactText}>
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
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Téléphone</Text>
              <Text style={styles.contactValue}>+34 632 607 101</Text>
            </View>
          </View>
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
  contentContainer: {
    paddingBottom: 40,
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  contactInfo: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    marginLeft: 16,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: colors.text,
  },
  bottomSpacer: {
    height: 20,
  },
});
