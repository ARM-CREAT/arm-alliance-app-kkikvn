
import { colors } from "@/styles/commonStyles";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Platform
} from "react-native";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from 'expo-haptics';

interface Region {
  id: string;
  name: string;
  cercles: string[];
  communes: number;
}

const MALI_REGIONS: Region[] = [
  {
    id: '1',
    name: 'Kayes',
    cercles: ['Kayes', 'Bafoulabé', 'Kéniéba', 'Kita', 'Nioro du Sahel', 'Diéma', 'Yélimané'],
    communes: 129
  },
  {
    id: '2',
    name: 'Koulikoro',
    cercles: ['Koulikoro', 'Kati', 'Kolokani', 'Nara', 'Banamba', 'Dioïla', 'Kangaba'],
    communes: 108
  },
  {
    id: '3',
    name: 'Sikasso',
    cercles: ['Sikasso', 'Bougouni', 'Kadiolo', 'Kolondiéba', 'Koutiala', 'Yanfolila', 'Yorosso'],
    communes: 147
  },
  {
    id: '4',
    name: 'Ségou',
    cercles: ['Ségou', 'Bla', 'Baraouéli', 'Macina', 'Niono', 'San', 'Tominian'],
    communes: 118
  },
  {
    id: '5',
    name: 'Mopti',
    cercles: ['Mopti', 'Bandiagara', 'Djenné', 'Douentza', 'Koro', 'Tenenkou', 'Youwarou', 'Bankass'],
    communes: 108
  },
  {
    id: '6',
    name: 'Tombouctou',
    cercles: ['Tombouctou', 'Diré', 'Goundam', 'Gourma-Rharous', 'Niafunké'],
    communes: 52
  },
  {
    id: '7',
    name: 'Gao',
    cercles: ['Gao', 'Ansongo', 'Bourem', 'Ménaka'],
    communes: 47
  },
  {
    id: '8',
    name: 'Kidal',
    cercles: ['Kidal', 'Abeïbara', 'Tessalit', 'Tin-Essako'],
    communes: 11
  },
  {
    id: '9',
    name: 'Bamako',
    cercles: ['Commune I', 'Commune II', 'Commune III', 'Commune IV', 'Commune V', 'Commune VI'],
    communes: 6
  }
];

export default function RegionsScreen() {
  const router = useRouter();
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const handleRegionPress = (regionId: string) => {
    console.log('User tapped region:', regionId);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedRegion(expandedRegion === regionId ? null : regionId);
  };

  const totalCommunes = MALI_REGIONS.reduce((sum, region) => sum + region.communes, 0);
  const totalCercles = MALI_REGIONS.reduce((sum, region) => sum + region.cercles.length, 0);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Régions du Mali',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{MALI_REGIONS.length}</Text>
            <Text style={styles.statLabel}>Régions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCercles}</Text>
            <Text style={styles.statLabel}>Cercles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCommunes}</Text>
            <Text style={styles.statLabel}>Communes</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Présence Nationale</Text>
          <Text style={styles.headerSubtitle}>
            L&apos;A.R.M est présent dans toutes les régions du Mali, des villages aux grandes villes.
          </Text>
        </View>

        {/* Regions List */}
        <View style={styles.section}>
          {MALI_REGIONS.map((region) => {
            const isExpanded = expandedRegion === region.id;
            
            return (
              <View key={region.id} style={styles.regionContainer}>
                <TouchableOpacity 
                  style={styles.regionCard}
                  onPress={() => handleRegionPress(region.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.regionHeader}>
                    <View style={styles.regionIconContainer}>
                      <IconSymbol 
                        ios_icon_name="map.fill" 
                        android_material_icon_name="place" 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                    <View style={styles.regionInfo}>
                      <Text style={styles.regionName}>{region.name}</Text>
                      <View style={styles.regionStats}>
                        <Text style={styles.regionStat}>{region.cercles.length} cercles</Text>
                        <Text style={styles.regionDot}>•</Text>
                        <Text style={styles.regionStat}>{region.communes} communes</Text>
                      </View>
                    </View>
                    <IconSymbol 
                      ios_icon_name={isExpanded ? "chevron.up" : "chevron.down"} 
                      android_material_icon_name={isExpanded ? "expand-less" : "expand-more"} 
                      size={24} 
                      color={colors.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.cerclesContainer}>
                    <Text style={styles.cerclesTitle}>Cercles:</Text>
                    <View style={styles.cerclesList}>
                      {region.cercles.map((cercle, index) => (
                        <View key={index} style={styles.cercleItem}>
                          <IconSymbol 
                            ios_icon_name="circle.fill" 
                            android_material_icon_name="circle" 
                            size={6} 
                            color={colors.primary} 
                          />
                          <Text style={styles.cercleName}>{cercle}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaCard}>
            <IconSymbol 
              ios_icon_name="person.3.fill" 
              android_material_icon_name="group" 
              size={48} 
              color={colors.primary} 
            />
            <Text style={styles.ctaTitle}>Rejoignez-nous dans votre région</Text>
            <Text style={styles.ctaText}>
              L&apos;A.R.M a besoin de militants engagés dans chaque région, cercle et commune du Mali.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => {
                console.log('User tapped Join button from regions');
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push('/(tabs)/profile');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Adhérer au parti</Text>
              <IconSymbol 
                ios_icon_name="arrow.right" 
                android_material_icon_name="arrow-forward" 
                size={20} 
                color={colors.background} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.background,
  },
  statLabel: {
    fontSize: 14,
    color: colors.background,
    marginTop: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
  },
  regionContainer: {
    marginBottom: 12,
  },
  regionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  regionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionStat: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  regionDot: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  cerclesContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  cerclesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cerclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cercleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  cercleName: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  ctaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginRight: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});
