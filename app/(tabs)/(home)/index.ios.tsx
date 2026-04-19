import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const LOGO = require('@/assets/images/c1a61b41-ad59-4c54-a7a6-e989df1049e3.jpeg');

export default function HomeScreen() {
  const router = useRouter();

  const handleSettings = () => {
    console.log('[Home] Paramètres pressed');
    router.push('/settings' as any);
  };

  const handleProgram = () => {
    console.log('[Home] Notre Programme pressed');
    router.push('/program' as any);
  };

  const handleIdeologie = () => {
    console.log('[Home] Idéologie pressed');
    router.push('/ideology' as any);
  };

  const handleContact = () => {
    console.log('[Home] Contact pressed');
    router.push('/contact' as any);
  };

  const handleDon = () => {
    console.log('[Home] Faire un Don pressed');
    router.push('/donation' as any);
  };

  const settingsIcon = '⚙️';

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: false,
          headerStyle: { backgroundColor: '#1B7A3E' },
          headerTintColor: '#FFFFFF',
          title: '',
          headerRight: () => (
            <TouchableOpacity onPress={handleSettings} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>{settingsIcon}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={resolveImageSource(LOGO)} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>A.R.M</Text>
          <Text style={styles.subtitle}>Alliance pour le Rassemblement Malien</Text>
          <Text style={styles.motto}>Fraternité • Liberté • Égalité</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={handleProgram} activeOpacity={0.85}>
            <Text style={styles.btnText}>Notre Programme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={handleIdeologie} activeOpacity={0.85}>
            <Text style={styles.btnText}>Idéologie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={handleContact} activeOpacity={0.85}>
            <Text style={styles.btnText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={handleDon} activeOpacity={0.85}>
            <Text style={styles.btnText}>Faire un Don</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleSettings} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>⚙️  Paramètres</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: '#1B7A3E', alignItems: 'center', paddingTop: 32, paddingBottom: 40, paddingHorizontal: 24 },
  logo: { width: 160, height: 160, marginBottom: 20, borderRadius: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 3, marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 12 },
  motto: { fontSize: 14, fontWeight: '700', color: '#F5C518', fontStyle: 'italic' },
  actions: { padding: 20, gap: 12 },
  btn: { backgroundColor: '#1B7A3E', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  btnSecondary: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#1B7A3E' },
  btnSecondaryText: { color: '#1B7A3E', fontSize: 16, fontWeight: '600' },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnText: { fontSize: 22 },
});
