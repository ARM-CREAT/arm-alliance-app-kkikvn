import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const LOGO = require('@/assets/images/c1a61b41-ad59-4c54-a7a6-e989df1049e3.jpeg');

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>A.R.M</Text>
        <Text style={styles.subtitle}>Alliance pour le Rassemblement Malien</Text>
        <Text style={styles.motto}>Fraternité • Liberté • Égalité</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => { console.log('[Home] Notre Programme pressed'); router.push('/program' as any); }}>
          <Text style={styles.btnText}>Notre Programme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { console.log('[Home] Idéologie pressed'); router.push('/ideology' as any); }}>
          <Text style={styles.btnText}>Idéologie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { console.log('[Home] Contact pressed'); router.push('/contact' as any); }}>
          <Text style={styles.btnText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { console.log('[Home] Faire un Don pressed'); router.push('/donation' as any); }}>
          <Text style={styles.btnText}>Faire un Don</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7FAF8' },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: '#1B7A3E', alignItems: 'center', paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24 },
  logo: { width: 160, height: 160, marginBottom: 20, borderRadius: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 3, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 12 },
  motto: { fontSize: 14, fontWeight: '700', color: '#F5C518', fontStyle: 'italic' },
  actions: { padding: 20, gap: 12 },
  btn: { backgroundColor: '#1B7A3E', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
