
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

export default function ManageNewsScreen() {
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
          title: 'Gérer les actualités',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="newspaper.fill"
            android_material_icon_name="article"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Gestion des actualités</Text>
          <Text style={styles.subtitle}>
            Créez, modifiez et supprimez les articles d&apos;actualité
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
            Cette fonctionnalité permet de gérer toutes les actualités du parti. Vous pouvez ajouter des photos, des vidéos et du contenu riche.
          </Text>
        </View>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={32}
              color={colors.success}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Créer des articles</Text>
              <Text style={styles.featureDescription}>
                Ajoutez de nouvelles actualités avec photos et vidéos
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="pencil.circle.fill"
              android_material_icon_name="edit"
              size={32}
              color={colors.warning}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Modifier le contenu</Text>
              <Text style={styles.featureDescription}>
                Mettez à jour les articles existants
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              ios_icon_name="trash.circle.fill"
              android_material_icon_name="delete"
              size={32}
              color={colors.danger}
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Supprimer des articles</Text>
              <Text style={styles.featureDescription}>
                Retirez les actualités obsolètes
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
