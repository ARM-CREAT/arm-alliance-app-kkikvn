
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import * as Haptics from 'expo-haptics';

const BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  totalCotisations?: number;
  recentMembers?: RecentMember[];
}

interface RecentMember {
  id: string;
  fullName: string;
  commune?: string;
  membershipNumber: string;
  status: string;
  joinedAt?: string;
}

function getStatusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return colors.success;
  if (s === 'pending') return colors.warning;
  if (s === 'suspended') return colors.danger;
  return colors.textSecondary;
}

function getStatusLabel(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'Actif';
  if (s === 'pending') return 'En attente';
  if (s === 'suspended') return 'Suspendu';
  return status;
}

function formatDate(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateString; }
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  const loadDashboard = useCallback(async () => {
    console.log('[AdminDashboard] GET /api/admin/dashboard');
    setError(null);
    try {
      const adminPassword = await AsyncStorage.getItem('admin_password');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminPassword) headers['x-admin-password'] = adminPassword;

      const response = await fetch(`${BACKEND_URL}/api/admin/dashboard`, { headers });
      if (!response.ok) {
        const text = await response.text();
        console.error('[AdminDashboard] Erreur:', response.status, text);
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      console.log('[AdminDashboard] Stats chargées:', JSON.stringify(data));
      setStats(data);
    } catch (err: any) {
      console.error('[AdminDashboard] Erreur chargement:', err.message);
      setError(err.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkSetup = async () => {
      const completed = await AsyncStorage.getItem('quick_setup_completed');
      setShowQuickSetup(!completed);
    };
    checkSetup();
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    console.log('[AdminDashboard] Pull-to-refresh');
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const handleNavigation = (path: string, label: string) => {
    console.log('[AdminDashboard] Navigation vers', label);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const handleLogout = async () => {
    console.log('[AdminDashboard] Déconnexion admin');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await AsyncStorage.removeItem('admin_password');
      router.replace('/admin/login');
    } catch (err) {
      console.error('[AdminDashboard] Erreur déconnexion:', err);
    }
  };

  const totalStr = String(stats?.totalMembers ?? 0);
  const activeStr = String(stats?.activeMembers ?? 0);
  const pendingStr = String(stats?.pendingMembers ?? 0);
  const suspendedStr = String(stats?.suspendedMembers ?? 0);
  const cotisationsStr = stats?.totalCotisations != null
    ? Number(stats.totalCotisations).toLocaleString('fr-FR') + ' FCFA'
    : '—';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tableau de Bord',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {/* Stats section */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Impossible de charger les stats</Text>
              <Text style={styles.errorText}>{error}</Text>
              <AnimatedPressable style={styles.retryBtn} onPress={() => { console.log('[AdminDashboard] Bouton Réessayer appuyé'); setLoading(true); loadDashboard(); }}>
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <>
              {/* Total card */}
              <View style={styles.totalCard}>
                <Text style={styles.totalNumber}>{totalStr}</Text>
                <Text style={styles.totalLabel}>Adhérents inscrits</Text>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
                  <Text style={[styles.statNumber, { color: colors.success }]}>{activeStr}</Text>
                  <Text style={styles.statLabel}>Actifs</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>{pendingStr}</Text>
                  <Text style={styles.statLabel}>En attente</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: colors.danger }]}>
                  <Text style={[styles.statNumber, { color: colors.danger }]}>{suspendedStr}</Text>
                  <Text style={styles.statLabel}>Suspendus</Text>
                </View>
              </View>

              {/* Cotisations */}
              <View style={styles.cotisationCard}>
                <Text style={styles.cotisationLabel}>Total cotisations collectées</Text>
                <Text style={styles.cotisationAmount}>{cotisationsStr}</Text>
              </View>

              {/* Recent members */}
              {stats?.recentMembers && stats.recentMembers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Derniers adhérents</Text>
                  {stats.recentMembers.slice(0, 5).map((member) => {
                    const statusColor = getStatusColor(member.status);
                    const statusLabel = getStatusLabel(member.status);
                    const dateStr = formatDate(member.joinedAt);
                    return (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(member.fullName || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName} numberOfLines={1}>{member.fullName}</Text>
                          <Text style={styles.memberMeta}>{member.commune || '—'} • {dateStr}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsRow}>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/members-list', 'Adhérents')}
              >
                <Text style={styles.actionBtnIcon}>👥</Text>
                <Text style={styles.actionBtnText}>Voir tous les adhérents</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/admin/notifications', 'Notifications')}
              >
                <Text style={styles.actionBtnIcon}>📢</Text>
                <Text style={styles.actionBtnText}>Envoyer une notification</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.actionBtn}
                onPress={() => handleNavigation('/admin/memberships', 'Adhésions')}
              >
                <Text style={styles.actionBtnIcon}>📋</Text>
                <Text style={styles.actionBtnText}>Gérer les adhésions</Text>
                <Text style={styles.actionBtnChevron}>›</Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* Content management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestion du contenu</Text>
            <View style={styles.grid}>
              {[
                { path: '/admin/news', label: 'Actualités', icon: '📰' },
                { path: '/admin/events', label: 'Événements', icon: '📅' },
                { path: '/admin/leadership', label: 'Direction', icon: '👤' },
                { path: '/admin/media', label: 'Médias', icon: '🖼️' },
                { path: '/admin/membership-stats', label: 'Stats', icon: '📊' },
                { path: '/admin/offline-access', label: 'Hors ligne', icon: '📴' },
              ].map((item) => (
                <AnimatedPressable
                  key={item.path}
                  style={styles.gridCard}
                  onPress={() => handleNavigation(item.path, item.label)}
                >
                  <Text style={styles.gridCardIcon}>{item.icon}</Text>
                  <Text style={styles.gridCardLabel}>{item.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>

          {/* Logout */}
          <AnimatedPressable style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol
              ios_icon_name="rectangle.portrait.and.arrow.right"
              android_material_icon_name="logout"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </AnimatedPressable>
        </ScrollView>
      </View>
    </>
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
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  totalNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  cotisationCard: {
    backgroundColor: colors.accentMuted,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cotisationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  cotisationAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  memberMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnChevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
