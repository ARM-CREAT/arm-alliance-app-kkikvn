
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Language } from '@/constants/translations';
import { Currency, currencies, getCurrencyName } from '@/utils/currency';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, currency, setLanguage, setCurrency, t } = useLocalization();
  const [expandedSection, setExpandedSection] = useState<'language' | 'currency' | null>(null);

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const currencyList: Currency[] = ['XOF', 'EUR', 'USD', 'GBP'];

  const handleLanguageChange = async (lang: Language) => {
    console.log('[Settings] User selected language:', lang);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setLanguage(lang);
    setExpandedSection(null);
  };

  const handleCurrencyChange = async (curr: Currency) => {
    console.log('[Settings] User selected currency:', curr);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setCurrency(curr);
    setExpandedSection(null);
  };

  const toggleSection = (section: 'language' | 'currency') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedSection(expandedSection === section ? null : section);
  };

  const currentLanguageName = languages.find(l => l.code === language)?.nativeName || 'Français';
  const currentCurrencyName = getCurrencyName(currency, language);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Paramètres',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="gear"
            android_material_icon_name="settings"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Paramètres</Text>
          <Text style={styles.headerSubtitle}>
            Langue et Devise
          </Text>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('language')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol
                ios_icon_name="globe"
                android_material_icon_name="language"
                size={24}
                color={colors.primary}
              />
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Langue</Text>
                <Text style={styles.sectionValue}>{currentLanguageName}</Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name={expandedSection === 'language' ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={expandedSection === 'language' ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'language' && (
            <View style={styles.optionsList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.optionItem,
                    language === lang.code && styles.optionItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionName}>{lang.nativeName}</Text>
                    <Text style={styles.optionSubname}>{lang.name}</Text>
                  </View>
                  {language === lang.code && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Currency Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('currency')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol
                ios_icon_name="dollarsign.circle"
                android_material_icon_name="attach-money"
                size={24}
                color={colors.primary}
              />
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Devise</Text>
                <Text style={styles.sectionValue}>{currentCurrencyName}</Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name={expandedSection === 'currency' ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={expandedSection === 'currency' ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {expandedSection === 'currency' && (
            <View style={styles.optionsList}>
              {currencyList.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.optionItem,
                    currency === curr && styles.optionItemSelected,
                  ]}
                  onPress={() => handleCurrencyChange(curr)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionName}>
                      {getCurrencyName(curr, language)}
                    </Text>
                    <Text style={styles.optionSubname}>
                      {currencies[curr].symbol} - {curr}
                    </Text>
                  </View>
                  {currency === curr && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Les montants seront affichés dans la devise sélectionnée. Les taux de change sont mis à jour régulièrement.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  sectionValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionItemSelected: {
    backgroundColor: colors.backgroundAlt,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  optionSubname: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});
