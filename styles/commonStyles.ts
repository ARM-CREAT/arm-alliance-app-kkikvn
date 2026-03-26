
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  primary: '#1B7A3E',        // Vert Mali profond
  primaryLight: '#2A9D5C',   // Vert clair
  primaryMuted: '#E8F5EE',   // Vert très clair
  secondary: '#F5C518',      // Jaune/or Mali
  accent: '#F5C518',         // Jaune/or Mali
  accentMuted: '#FEF9E7',    // Jaune très clair
  background: '#F7FAF8',     // Blanc cassé teinté vert
  backgroundAlt: '#EEF5F1',  // Vert très clair
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF5F1',
  text: '#0D2818',           // Noir très foncé teinté vert
  textSecondary: '#4A7060',  // Gris teinté vert
  textTertiary: '#8AAF9A',   // Gris clair teinté vert
  card: '#FFFFFF',
  border: 'rgba(27, 122, 62, 0.12)',
  divider: 'rgba(27, 122, 62, 0.06)',
  success: '#1B7A3E',
  warning: '#F5C518',
  danger: '#DC2626',
  error: '#DC2626',
  info: '#2563EB',
  highlight: '#1B7A3E',
  aiAccent: '#2563EB',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  icon: {
    width: 60,
    height: 60,
  },
});
