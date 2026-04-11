import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { BACKEND_URL } from '@/utils/api';

interface AdminStats {
  total_members: number;
  pending_members: number;
  approved_members: number;
  total_messages: number;
  unread_messages: number;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const displayValue = String(value ?? 0);
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminIndexScreen() {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    console.log('[AdminIndex] GET /api/admin/stats');
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`);
      if (!res.ok) {
        const text = await res.text();
        console.error('[AdminIndex] Erreur HTTP stats', res.status, text.slice(0, 120));
        throw new Error(`Erreur ${res.status}`);
      }
      const data: AdminStats = await res.json();
      console.log('[AdminIndex] Stats chargées:', JSON.stringify(data));
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminIndex] Erreur chargement stats:', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats(false);
    }, [loadStats])
  );

  const onRefresh = useCallback(() => {
    console.log('[AdminIndex] Pull-to-refresh');
    setRefreshing(true);
    loadStats(true);
  }, [loadStats]);

  const handleLogout = async () => {
    console.log('[AdminIndex] Bouton Déconnexion appuyé');
    await logout();
    router.replace('/admin/login');
  };

  const totalMembers = stats?.total_members ?? 0;
  const pendingMembers = stats?.pending_members ?? 0;
  const approvedMembers = stats?.approved_members ?? 0;
  const totalMessages = stats?.total_messages ?? 0;
  const unreadMessages = stats?.unread_messages ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tableau de bord',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.headerLogoutBtn}
            >
              <Text style={styles.headerLogoutText}>Déconnexion</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Welcome banner */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeTitle}>Tableau de bord Admin</Text>
          <Text style={styles.welcomeSubtitle}>Alliance pour le Rassemblement Malien</Text>
        </View>

        {/* Stats section */}
        <Text style={styles.sectionTitle}>Statistiques</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                console.log('[AdminIndex] Bouton Réessayer appuyé');
                loadStats(false);
              }}
            >
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard icon="👥" label="Total membres" value={totalMembers} color={colors.primary} />
            <StatCard icon="⏳" label="En attente" value={pendingMembers} color="#D97706" />
            <StatCard icon="✅" label="Approuvés" value={approvedMembers} color="#16a34a" />
            <StatCard icon="📨" label="Messages" value={totalMessages} color="#2563EB" />
            <StatCard icon="🔔" label="Non lus" value={unreadMessages} color="#DC2626" />
          </View>
        )}

        {/* Navigation buttons */}
        <Text style={styles.sectionTitle}>Gestion</Text>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => {
            console.log('[AdminIndex] Navigation vers /admin/memberships');
            router.push('/admin/memberships');
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.navIconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Text style={styles.navIcon}>👥</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navLabel}>Adhésions</Text>
            <Text style={styles.navDesc}>Consulter et gérer les membres</Text>
          </View>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => {
            console.log('[AdminIndex] Navigation vers /admin/messages');
            router.push('/admin/messages');
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.navIconWrap, { backgroundColor: '#7C3AED18' }]}>
            <Text style={styles.navIcon}>📣</Text>
          </View>
          <View style={styles.navInfo}>
            <Text style={styles.navLabel}>Messages ARM</Text>
            <Text style={styles.navDesc}>Gérer les messages de l'organisation</Text>
          </View>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerLogoutBtn: {
    marginRight: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerLogoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  welcomeBox: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 22,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  navIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  navIcon: {
    fontSize: 22,
  },
  navInfo: {
    flex: 1,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  navDesc: {
    fontSize: 13,
    color: '#666',
  },
  navArrow: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '700',
  },
});
