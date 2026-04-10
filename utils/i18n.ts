
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { translations, Language } from '@/constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Map device language to supported languages
const languageMap: Record<string, Language> = {
  'fr': 'fr',
  'en': 'en',
  'bm': 'bm',
  'es': 'es',
  'ar': 'ar',
};

// Create i18n instance — guarded so a bad translations shape never crashes at import time
let i18n: I18n;
try {
  i18n = new I18n(translations);
  i18n.defaultLocale = 'fr';
  i18n.enableFallback = true;

  // Get device locale
  const locales = getLocales();
  const deviceLocale = locales[0];
  const deviceLanguage = deviceLocale?.languageCode || 'fr';
  i18n.locale = languageMap[deviceLanguage] || 'fr';
} catch (e) {
  console.error('[i18n] Failed to initialise i18n instance:', e);
  i18n = new I18n({});
  i18n.defaultLocale = 'fr';
  i18n.enableFallback = true;
  i18n.locale = 'fr';
}

// Load saved language preference
export const loadLanguagePreference = async (): Promise<Language> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('app_language');
    if (savedLanguage && languageMap[savedLanguage]) {
      i18n.locale = savedLanguage;
      return savedLanguage as Language;
    }
  } catch (error) {
    console.error('[i18n] Error loading language preference:', error);
  }
  return i18n.locale as Language;
};

// Save language preference
export const saveLanguagePreference = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem('app_language', language);
    i18n.locale = language;
    console.log('[i18n] Language preference saved:', language);
  } catch (error) {
    console.error('[i18n] Error saving language preference:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): Language => {
  return i18n.locale as Language;
};

// Translate function with interpolation support
export const t = (key: string, params?: Record<string, string | number>): string => {
  return i18n.t(key, params);
};

// Check if language is RTL (Right-to-Left)
export const isRTL = (): boolean => {
  return i18n.locale === 'ar';
};

export default i18n;
