import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const paddingTop = insets.top + 16;
  const paddingBottom = insets.bottom + 80;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alliance ARM</Text>
        <Text style={styles.headerSubtitle}>Alliance pour la République du Mali</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[HomeScreen] Adhérer pressed');
              router.push('/member/register');
            }}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Adhérer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[HomeScreen] Soutenir pressed');
              router.push('/donation');
            }}
          >
            <Text style={styles.actionIcon}>💚</Text>
            <Text style={styles.actionLabel}>Soutenir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[HomeScreen] Programme pressed');
              router.push('/program');
            }}
          >
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionLabel}>Programme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              console.log('[HomeScreen] Contact pressed');
              router.push('/contact');
            }}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notre mission</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            L'Alliance pour la République du Mali (ARM) est un parti politique engagé pour la démocratie,
            la justice sociale et le développement durable du Mali.
          </Text>
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>En savoir plus</Text>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => {
            console.log('[HomeScreen] Idéologie pressed');
            router.push('/ideology');
          }}
        >
          <Text style={styles.listItemText}>Notre idéologie</Text>
          <Text style={styles.listItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => {
            console.log('[HomeScreen] Membres pressed');
            router.push('/members-list');
          }}
        >
          <Text style={styles.listItemText}>Nos membres</Text>
          <Text style={styles.listItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => {
            console.log('[HomeScreen] Don pressed');
            router.push('/donation');
          }}
        >
          <Text style={styles.listItemText}>Faire un don</Text>
          <Text style={styles.listItemArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  header: {
    backgroundColor: '#1a3a6b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a6b',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a6b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  listItemArrow: {
    fontSize: 20,
    color: '#999',
  },
});
