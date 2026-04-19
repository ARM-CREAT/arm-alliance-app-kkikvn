import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' }}>Alliance ARM</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 12 }}>Application chargée ✓</Text>
    </View>
  );
}
