import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

// Lazy-load to prevent module-level crashes
function getTranslations() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/constants/translations').translations;
  } catch {
    return { fr: {} };
  }
}

function getI18nUtils() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const i18n = require('@/utils/i18n');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const currency = require('@/utils/currency');
    return {
      loadLanguagePreference: i18n.loadLanguagePreference,
      saveLanguagePreference: i18n.saveLanguagePreference,
      loadCurrencyPreference: currency.loadCurrencyPreference,
      saveCurrencyPreference: currency.saveCurrencyPreference,
    };
  } catch (e) {
    console.warn('[LocalizationContext] Failed to load i18n utils:', e);
    return {
      loadLanguagePreference: async () => 'fr' as Language,
      saveLanguagePreference: async () => {},
      loadCurrencyPreference: async () => 'XOF' as Currency,
      saveCurrencyPreference: async () => {},
    };
  }
}

export type Language = 'fr' | 'en' | 'bm' | 'es' | 'ar';
export type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP';

interface LocalizationContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => Promise<void>;
  setCurrency: (curr: Currency) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  loading: boolean;
}

function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
  try {
    const translations = getTranslations();
    const dict = translations[lang] as Record<string, string> | undefined;
    const fallback = translations['fr'] as Record<string, string>;
    let str: string = (dict && dict[key]) || fallback[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  } catch {
    return key;
  }
}

const defaultValue: LocalizationContextType = {
  language: 'fr',
  currency: 'XOF',
  setLanguage: async () => {},
  setCurrency: async () => {},
  t: (key) => key,
  isRTL: false,
  loading: false,
};

const LocalizationContext = createContext<LocalizationContextType>(defaultValue);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [currency, setCurrencyState] = useState<Currency>('XOF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      console.warn('[Localization] Safety timer fired — using defaults');
      setLoading(false);
    }, 2000);

    const loadPreferences = async () => {
      console.log('[Localization] Loading preferences...');
      try {
        const utils = getI18nUtils();
        const [savedLanguage, savedCurrency] = await Promise.all([
          utils.loadLanguagePreference(),
          utils.loadCurrencyPreference(),
        ]);
        setLanguageState(savedLanguage as Language);
        setCurrencyState(savedCurrency as Currency);
        if (Platform.OS !== 'web') {
          try {
            const shouldBeRTL = savedLanguage === 'ar';
            if (I18nManager.isRTL !== shouldBeRTL) {
              I18nManager.forceRTL(shouldBeRTL);
            }
          } catch {}
        }
        console.log('[Localization] Preferences loaded:', { language: savedLanguage, currency: savedCurrency });
      } catch (err) {
        console.warn('[Localization] Failed to load preferences (using defaults):', err);
      } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    };

    loadPreferences();
    return () => clearTimeout(safetyTimer);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    console.log('[Localization] Changing language to:', lang);
    setLanguageState(lang);
    try {
      const utils = getI18nUtils();
      await utils.saveLanguagePreference(lang);
    } catch (err) {
      console.warn('[Localization] Failed to save language preference:', err);
    }
    if (Platform.OS !== 'web') {
      try {
        const shouldBeRTL = lang === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL);
        }
      } catch {}
    }
  }, []);

  const setCurrency = useCallback(async (curr: Currency) => {
    console.log('[Localization] Changing currency to:', curr);
    setCurrencyState(curr);
    try {
      const utils = getI18nUtils();
      await utils.saveCurrencyPreference(curr);
    } catch (err) {
      console.warn('[Localization] Failed to save currency preference:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );

  return (
    <LocalizationContext.Provider value={{ language, currency, setLanguage, setCurrency, t, isRTL: language === 'ar', loading }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  return useContext(LocalizationContext);
};

export default LocalizationContext;
