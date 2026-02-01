
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/constants/translations';
import { Currency } from '@/utils/currency';
import { 
  loadLanguagePreference, 
  saveLanguagePreference, 
  getCurrentLanguage,
  t,
  isRTL
} from '@/utils/i18n';
import {
  loadCurrencyPreference,
  saveCurrencyPreference,
} from '@/utils/currency';
import { I18nManager } from 'react-native';

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

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [currency, setCurrencyState] = useState<Currency>('XOF');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      console.log('[Localization] Loading preferences...');
      const savedLanguage = await loadLanguagePreference();
      const savedCurrency = await loadCurrencyPreference();
      
      setLanguageState(savedLanguage);
      setCurrencyState(savedCurrency);
      
      // Update RTL layout if needed
      const shouldBeRTL = savedLanguage === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }
      
      setLoading(false);
      console.log('[Localization] Preferences loaded:', { language: savedLanguage, currency: savedCurrency });
    };

    loadPreferences();
  }, []);

  const setLanguage = async (lang: Language) => {
    console.log('[Localization] Changing language to:', lang);
    await saveLanguagePreference(lang);
    setLanguageState(lang);
    
    // Update RTL layout if needed
    const shouldBeRTL = lang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Note: App needs to restart for RTL changes to take effect
    }
  };

  const setCurrency = async (curr: Currency) => {
    console.log('[Localization] Changing currency to:', curr);
    await saveCurrencyPreference(curr);
    setCurrencyState(curr);
  };

  const value: LocalizationContextType = {
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    isRTL: isRTL(),
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
