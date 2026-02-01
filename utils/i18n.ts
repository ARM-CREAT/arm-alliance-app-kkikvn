
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { translations, Language } from '@/constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create i18n instance
const i18n = new I18n(translations);

// Set default language
i18n.defaultLocale = 'fr';
i18n.enableFallback = true;

// Get device locale
const deviceLocale = getLocales()[0];
const deviceLanguage = deviceLocale?.languageCode || 'fr';

// Map device language to supported languages
const languageMap: Record<string, Language> = {
  'fr': 'fr',
  'en': 'en',
  'bm': 'bm',
  'es': 'es',
  'ar': 'ar',
};

// Set initial locale based on device or default to French
i18n.locale = languageMap[deviceLanguage] || 'fr';

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
