import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import { Language, translations } from '@/constants/translations';
import { Currency } from '@/utils/currency';
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from '@/utils/i18n';
import {
  loadCurrencyPreference,
  saveCurrencyPreference,
} from '@/utils/currency';

interface LocalizationContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => Promise<void>;
  setCurrency: (curr: Currency) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  loading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] as Record<string, string> | undefined;
  const fallback = translations['fr'] as Record<string, string>;
  let str: string = (dict && dict[key]) || fallback[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return str;
}

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [currency, setCurrencyState] = useState<Currency>('XOF');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      console.warn('[Localization] Safety timer fired — using default preferences');
      setLoading(false);
    }, 2000);

    const loadPreferences = async () => {
      console.log('[Localization] Loading preferences...');
      try {
        const [savedLanguage, savedCurrency] = await Promise.all([
          loadLanguagePreference(),
          loadCurrencyPreference(),
        ]);

        setLanguageState(savedLanguage);
        setCurrencyState(savedCurrency);

        if (Platform.OS !== 'web') {
          const shouldBeRTL = savedLanguage === 'ar';
          if (I18nManager.isRTL !== shouldBeRTL) {
            I18nManager.forceRTL(shouldBeRTL);
          }
        }

        console.log('[Localization] Preferences loaded:', { language: savedLanguage, currency: savedCurrency });
      } catch (err) {
        console.error('[Localization] Failed to load preferences (using defaults):', err);
      } finally {
        clearTimeout(t);
        setLoading(false);
      }
    };

    loadPreferences();

    return () => clearTimeout(t);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    console.log('[Localization] Changing language to:', lang);
    setLanguageState(lang);
    try {
      await saveLanguagePreference(lang);
    } catch (err) {
      console.warn('[Localization] Failed to save language preference:', err);
    }

    if (Platform.OS !== 'web') {
      const shouldBeRTL = lang === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }
    }
  }, []);

  const setCurrency = useCallback(async (curr: Currency) => {
    console.log('[Localization] Changing currency to:', curr);
    setCurrencyState(curr);
    try {
      await saveCurrencyPreference(curr);
    } catch (err) {
      console.warn('[Localization] Failed to save currency preference:', err);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  const value: LocalizationContextType = {
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    isRTL: language === 'ar',
    loading,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
};
