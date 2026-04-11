
import { translations, Language } from '@/constants/translations';
import AsyncStorage from '@/lib/async-storage';

// Map device language to supported languages
const languageMap: Record<string, Language> = {
  'fr': 'fr',
  'en': 'en',
  'bm': 'bm',
  'es': 'es',
  'ar': 'ar',
};

// Minimal i18n shim — avoids importing i18n-js and expo-localization at module
// evaluation time, both of which can crash the web module graph.
type I18nShim = {
  locale: string;
  defaultLocale: string;
  enableFallback: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function makeI18n(): I18nShim {
  let _locale = 'fr';

  // Safely detect device locale — never throws
  try {
    // expo-localization is web-safe but guard anyway
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization');
    const locales = getLocales?.() ?? [];
    const deviceLanguage = locales[0]?.languageCode ?? 'fr';
    _locale = languageMap[deviceLanguage] ?? 'fr';
  } catch {
    _locale = 'fr';
  }

  return {
    get locale() { return _locale; },
    set locale(v: string) { _locale = v; },
    defaultLocale: 'fr',
    enableFallback: true,
    t(key: string, params?: Record<string, string | number>): string {
      const lang = (_locale as Language) in translations ? (_locale as Language) : 'fr';
      const dict = translations[lang] as Record<string, string>;
      const fallback = translations['fr'] as Record<string, string>;
      let str = dict?.[key] ?? fallback?.[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return str;
    },
  };
}

const i18n = makeI18n();

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
