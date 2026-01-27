
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

export default function MediaUploadScreen() {
  const router = useRouter();

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Télécharger des médias',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="photo.fill"
            android_material_icon_name="photo-library"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Téléchargement de médias</Text>
          <Text style={styles.subtitle}>
            Ajoutez des photos, vidéos et documents
          </Text>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Téléchargez des médias pour les utiliser dans les actualités, événements et autres contenus du parti.
          </Text>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="photo.circle.fill"
              android_material_icon_name="image"
              size={32}
              color={colors.success}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Photos</Text>
              <Text style={styles.featureDescription}>
                Téléchargez des images JPG, PNG, etc.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="video.circle.fill"
              android_material_icon_name="videocam"
              size={32}
              color={colors.warning}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Vidéos</Text>
              <Text style={styles.featureDescription}>
                Ajoutez des vidéos MP4, MOV, etc.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="doc.circle.fill"
              android_material_icon_name="description"
              size={32}
              color={colors.primary}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Documents</Text>
              <Text style={styles.featureDescription}>
                Téléchargez des PDF, documents Word, etc.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow-back"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.backButtonText}>Retour au tableau de bord</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
