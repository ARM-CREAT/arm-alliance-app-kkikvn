import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const ARM_GREEN = '#1B7A3E';
const ARM_YELLOW = '#F5C518';
const ARM_BLACK = '#0D0D0D';
const ARM_WHITE = '#FFFFFF';
const ARM_RED = '#DC2626';
const GREY = '#9CA3AF';
const BG = '#F7FAF8';

// ─── Image helper ─────────────────────────────────────────────────────────────
function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const logoSource = require('@/assets/images/15eeca6b-b1c8-4619-80b4-a98acd035b28.jpeg');

// ─── Profile row button ───────────────────────────────────────────────────────
function ProfileRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const labelColor = danger ? ARM_RED : ARM_BLACK;
  return (
    <TouchableOpacity style={styles.profileRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.profileRowIcon}>{icon}</Text>
      <Text style={[styles.profileRowLabel, { color: labelColor }]}>{label}</Text>
      <Text style={styles.profileRowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  function nav(route: string) {
    console.log('[ProfileScreen] Navigating to:', route);
    router.push(route as never);
  }

  const handleSignOut = async () => {
    console.log('[ProfileScreen] Déconnexion pressed');
    try {
      await signOut();
      console.log('[ProfileScreen] Déconnexion réussie');
    } catch (err) {
      console.error('[ProfileScreen] Erreur déconnexion:', err);
    }
  };

  const handleSignIn = () => {
    console.log('[ProfileScreen] Se connecter pressed');
    nav('/auth');
  };

  const handleMemberCard = () => {
    console.log('[ProfileScreen] Ma carte de membre pressed');
    nav('/member/card');
  };

  const handleSettings = () => {
    console.log('[ProfileScreen] Mes paramètres pressed');
    nav('/settings');
  };

  // ── Derived values ──
  const userName = user?.name || '';
  const userEmail = user?.email || '';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={resolveImageSource(logoSource)}
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <Text style={styles.headerTitle}>Mon Profil ARM</Text>
        </View>

        {user ? (
          <>
            {/* ── User info card ── */}
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>
              <View style={styles.userInfo}>
                {userName ? (
                  <Text style={styles.userName}>{userName}</Text>
                ) : null}
                <Text style={styles.userEmail}>{userEmail}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>✓ Membre actif</Text>
                </View>
              </View>
            </View>

            {/* ── Actions ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mon espace</Text>
              <View style={styles.rowsCard}>
                <ProfileRow
                  icon="🪪"
                  label="Ma carte de membre"
                  onPress={handleMemberCard}
                />
                <View style={styles.rowDivider} />
                <ProfileRow
                  icon="⚙️"
                  label="Mes paramètres"
                  onPress={handleSettings}
                />
                <View style={styles.rowDivider} />
                <ProfileRow
                  icon="🚪"
                  label="Déconnexion"
                  onPress={handleSignOut}
                  danger
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* ── Not connected ── */}
            <View style={styles.guestCard}>
              <Text style={styles.guestIcon}>👤</Text>
              <Text style={styles.guestTitle}>Vous n'êtes pas connecté</Text>
              <Text style={styles.guestSubtitle}>
                Connectez-vous pour accéder à votre espace membre ARM
              </Text>
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={handleSignIn}
                activeOpacity={0.85}
              >
                <Text style={styles.signInBtnText}>Se connecter / S'inscrire</Text>
              </TouchableOpacity>
            </View>

            {/* ── Quick links for guests ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Découvrir l'ARM</Text>
              <View style={styles.rowsCard}>
                <ProfileRow
                  icon="📋"
                  label="Adhérer au parti"
                  onPress={() => {
                    console.log('[ProfileScreen] Adhérer pressed (guest)');
                    nav('/member/register');
                  }}
                />
                <View style={styles.rowDivider} />
                <ProfileRow
                  icon="📖"
                  label="Notre programme"
                  onPress={() => {
                    console.log('[ProfileScreen] Programme pressed (guest)');
                    nav('/program');
                  }}
                />
                <View style={styles.rowDivider} />
                <ProfileRow
                  icon="📞"
                  label="Nous contacter"
                  onPress={() => {
                    console.log('[ProfileScreen] Contact pressed (guest)');
                    nav('/contact');
                  }}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Alliance pour le Rassemblement Malien</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ARM_GREEN,
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 48,
  },

  // Header
  header: {
    backgroundColor: ARM_GREEN,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: ARM_YELLOW,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ARM_WHITE,
    letterSpacing: 0.5,
  },

  // User card
  userCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: ARM_WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ARM_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: ARM_WHITE,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: ARM_BLACK,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: GREY,
    marginBottom: 6,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: ARM_GREEN + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ARM_GREEN,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ARM_BLACK,
    marginBottom: 10,
  },
  rowsCard: {
    backgroundColor: ARM_WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  profileRowIcon: {
    fontSize: 22,
  },
  profileRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  profileRowChevron: {
    fontSize: 22,
    color: GREY,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },

  // Guest card
  guestCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: ARM_WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ARM_BLACK,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 13,
    color: GREY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: ARM_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: ARM_WHITE,
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: GREY,
    textAlign: 'center',
  },
});
