
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

const MOCK_STATS = {
  activeMembers: 1248,
  newThisMonth: 87,
  renewalRate: 76,
  pendingRenewals: 34,
};

const MOCK_MONTHLY = [
  { month: 'Jan', count: 52 },
  { month: 'Fév', count: 61 },
  { month: 'Mar', count: 74 },
  { month: 'Avr', count: 68 },
  { month: 'Mai', count: 83 },
  { month: 'Jun', count: 87 },
];

const MAX_COUNT = Math.max(...MOCK_MONTHLY.map((m) => m.count));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 68 : 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flexShrink: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  statSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 28,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  barValue: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  listContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listRowLabel: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  listRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 6,
  },
});

interface StatCardProps {
  icon_ios: string;
  icon_android: string;
  label: string;
  value: number;
  suffix?: string;
  iconColor?: string;
}

function StatCard({ icon_ios, icon_android, label, value, suffix, iconColor }: StatCardProps) {
  const displayValue = String(value);
  const displaySuffix = suffix ?? '';
  const cardColor = iconColor ?? colors.primary;

  return (
    <View style={styles.statCard}>
      <View style={styles.statIconRow}>
        <IconSymbol
          ios_icon_name={icon_ios}
          android_material_icon_name={icon_android}
          size={20}
          color={cardColor}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={styles.statValue}>{displayValue}</Text>
        <Text style={styles.statSuffix}>{displaySuffix}</Text>
      </View>
    </View>
  );
}

export default function MembershipStatsScreen() {
  const router = useRouter();

  const handleBack = () => {
    console.log('Retour depuis Stats Adhésion');
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Statistiques Adhésion',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Statistiques Adhésion</Text>
            <Text style={styles.subtitle}>Vue d'ensemble des membres</Text>
          </View>

          {/* KPI Cards */}
          <View style={styles.grid}>
            <StatCard
              icon_ios="person.3.fill"
              icon_android="group"
              label="Membres actifs"
              value={MOCK_STATS.activeMembers}
              iconColor={colors.primary}
            />
            <StatCard
              icon_ios="person.badge.plus"
              icon_android="person-add"
              label="Nouveaux ce mois"
              value={MOCK_STATS.newThisMonth}
              iconColor={colors.accent}
            />
            <StatCard
              icon_ios="arrow.clockwise.circle.fill"
              icon_android="autorenew"
              label="Taux de renouvellement"
              value={MOCK_STATS.renewalRate}
              suffix="%"
              iconColor={colors.primary}
            />
            <StatCard
              icon_ios="clock.badge.exclamationmark"
              icon_android="pending-actions"
              label="Renouvellements en attente"
              value={MOCK_STATS.pendingRenewals}
              iconColor={colors.error}
            />
          </View>

          {/* Bar Chart */}
          <Text style={styles.sectionTitle}>Nouveaux membres (6 mois)</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {MOCK_MONTHLY.map((item) => {
                const barHeight = Math.round((item.count / MAX_COUNT) * 100);
                const countLabel = String(item.count);
                return (
                  <View key={item.month} style={styles.barWrapper}>
                    <Text style={styles.barValue}>{countLabel}</Text>
                    <View style={[styles.bar, { height: barHeight }]} />
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Detail List */}
          <Text style={styles.sectionTitle}>Détail par statut</Text>
          <View style={styles.listContainer}>
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
                <Text style={styles.listRowLabel}>Membres à jour</Text>
              </View>
              <Text style={styles.listRowValue}>1 214</Text>
            </View>
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={colors.accent} />
                <Text style={styles.listRowLabel}>En attente de validation</Text>
              </View>
              <Text style={[styles.listRowValue, { color: colors.accent }]}>34</Text>
            </View>
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.error} />
                <Text style={styles.listRowLabel}>Cotisation expirée</Text>
              </View>
              <Text style={[styles.listRowValue, { color: colors.error }]}>87</Text>
            </View>
            <View style={[styles.listRow, styles.listRowLast]}>
              <View style={styles.listRowLeft}>
                <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={20} color="#F59E0B" />
                <Text style={styles.listRowLabel}>Membres fondateurs</Text>
              </View>
              <Text style={[styles.listRowValue, { color: '#F59E0B' }]}>12</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
