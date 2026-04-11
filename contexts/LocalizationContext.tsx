
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager } from 'react-native';
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

/**
 * Translate a key using the given language, with optional interpolation.
 * Falls back to French, then to the key itself.
 */
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety net: never block rendering for more than 1.5s waiting on AsyncStorage
    const safetyTimer = setTimeout(() => {
      console.warn('[Localization] Safety timer fired — forcing loading=false');
      setLoading(false);
    }, 1500);

    const loadPreferences = async () => {
      console.log('[Localization] Loading preferences from AsyncStorage...');
      try {
        const [savedLanguage, savedCurrency] = await Promise.all([
          loadLanguagePreference(),
          loadCurrencyPreference(),
        ]);

        setLanguageState(savedLanguage);
        setCurrencyState(savedCurrency);

        // Apply RTL layout if Arabic
        const shouldBeRTL = savedLanguage === 'ar';
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL);
        }

        console.log('[Localization] Preferences loaded:', { language: savedLanguage, currency: savedCurrency });
      } catch (err) {
        console.error('[Localization] Failed to load preferences:', err);
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
    await saveLanguagePreference(lang);
    setLanguageState(lang);

    // Apply RTL layout if Arabic
    const shouldBeRTL = lang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Note: full RTL layout requires app restart, but text direction updates immediately
    }
  }, []);

  const setCurrency = useCallback(async (curr: Currency) => {
    console.log('[Localization] Changing currency to:', curr);
    await saveCurrencyPreference(curr);
    setCurrencyState(curr);
  }, []);

  // Reactive translate function — re-created when language changes so all
  // consumers that call t() automatically get the new strings on re-render.
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
