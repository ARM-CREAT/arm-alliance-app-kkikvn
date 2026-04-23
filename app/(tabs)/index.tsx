import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alliance ARM</Text>
        <Text style={styles.headerSub}>Alliance pour la République du Mali</Text>
      </View>
      <View style={styles.grid}>
        {[
          { label: 'Adhérer', icon: '📋', route: '/member/register' },
          { label: 'Programme', icon: '📖', route: '/program' },
          { label: 'Soutenir', icon: '💚', route: '/donation' },
          { label: 'Contact', icon: '📞', route: '/contact' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            onPress={() => {
              console.log('[HomeScreen] Card pressed:', item.label, '→', item.route);
              router.push(item.route as any);
            }}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.about}>
        <Text style={styles.aboutTitle}>Notre mission</Text>
        <Text style={styles.aboutText}>
          L'Alliance pour la République du Mali (ARM) est un parti politique engagé pour la démocratie, la justice sociale et le développement durable du Mali.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 20 },
  header: { backgroundColor: '#1a3a6b', borderRadius: 16, padding: 24, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, elevation: 2 },
  cardIcon: { fontSize: 30 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#1a3a6b' },
  about: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a6b', marginBottom: 8 },
  aboutText: { fontSize: 14, color: '#444', lineHeight: 22 },
});
