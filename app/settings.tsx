
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Language } from '@/constants/translations';
import { Currency } from '@/utils/currency';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bm', label: 'Bambara', flag: '🇲🇱' },
];

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'XOF', label: 'Franc CFA', symbol: 'FCFA' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'Dollar US', symbol: '$' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { language, currency, setLanguage, setCurrency, t } = useLocalization();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLanguageSelect = async (lang: Language) => {
    console.log('[Settings] Langue sélectionnée:', lang);
    await setLanguage(lang);
  };

  const handleCurrencySelect = async (curr: Currency) => {
    console.log('[Settings] Devise sélectionnée:', curr);
    await setCurrency(curr);
  };

  const handleNotificationsToggle = (value: boolean) => {
    console.log('[Settings] Notifications toggled:', value);
    setNotificationsEnabled(value);
  };

  const handleNotificationPreferences = () => {
    console.log('[Settings] Bouton Préférences de notifications appuyé');
    router.push('/notification-preferences');
  };

  const handleAdminAccess = () => {
    console.log('[Settings] Bouton Accès Admin appuyé');
    router.push('/admin/login');
  };

  const handleMembership = () => {
    console.log('[Settings] Bouton Adhésion appuyé');
    router.push('/(tabs)/profile');
  };

  const handleMessages = () => {
    console.log('[Settings] Bouton Messages ARM appuyé');
    router.push('/arm-message');
  };

  const handleMembersList = () => {
    console.log('[Settings] Bouton Liste des membres appuyé');
    router.push('/members-list');
  };

  const handleBack = () => {
    console.log('[Settings] Bouton Retour appuyé');
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('settings'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: t('back'),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.card}>
            {LANGUAGES.map((lang, index) => {
              const isSelected = language === lang.code;
              const isLast = index === LANGUAGES.length - 1;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.optionRow, !isLast && styles.optionRowBorder]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionFlag}>{lang.flag}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('currency')}</Text>
          <View style={styles.card}>
            {CURRENCIES.map((curr, index) => {
              const isSelected = currency === curr.code;
              const isLast = index === CURRENCIES.length - 1;
              return (
                <TouchableOpacity
                  key={curr.code}
                  style={[styles.optionRow, !isLast && styles.optionRowBorder]}
                  onPress={() => handleCurrencySelect(curr.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionSymbol}>{curr.symbol}</Text>
                  <View style={styles.optionTextBlock}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {curr.label}
                    </Text>
                    <Text style={styles.optionCode}>{curr.code}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.sectionHint}>{t('currencyInfo')}</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextBlock}>
                <Text style={styles.switchLabel}>Activer les notifications</Text>
                <Text style={styles.switchDesc}>Recevoir les actualités et annonces</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.optionRowBorder} />
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleNotificationPreferences}
              activeOpacity={0.7}
            >
              <Text style={styles.optionLabel}>Préférences de notifications</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.card}>
            <View style={[styles.optionRow, styles.optionRowBorder]}>
              <Text style={styles.optionLabel}>Application</Text>
              <Text style={styles.optionValue}>Alliance ARM</Text>
            </View>
            <View style={[styles.optionRow, styles.optionRowBorder]}>
              <Text style={styles.optionLabel}>Version</Text>
              <Text style={styles.optionValue}>1.0.0</Text>
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Parti</Text>
              <Text style={styles.optionValue}>Alliance pour le Rassemblement Malien</Text>
            </View>
          </View>
        </View>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation rapide</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.optionRow, styles.optionRowBorder]}
              onPress={handleMembership}
              activeOpacity={0.7}
            >
              <Text style={styles.optionFlag}>👥</Text>
              <Text style={styles.optionLabel}>Adhésion ARM</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionRow, styles.optionRowBorder]}
              onPress={handleMessages}
              activeOpacity={0.7}
            >
              <Text style={styles.optionFlag}>📣</Text>
              <Text style={styles.optionLabel}>Messages ARM</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleMembersList}
              activeOpacity={0.7}
            >
              <Text style={styles.optionFlag}>📋</Text>
              <Text style={styles.optionLabel}>Liste des membres</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Access */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={handleAdminAccess}
            activeOpacity={0.8}
          >
            <Text style={styles.adminButtonText}>🔒 Accès Administrateur</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionFlag: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  optionSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    width: 40,
    textAlign: 'center',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionCode: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  optionValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 180,
    textAlign: 'right',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  switchTextBlock: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  switchDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adminButton: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 20,
  },
});
