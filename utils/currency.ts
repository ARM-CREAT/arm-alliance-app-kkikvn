
import AsyncStorage from '@react-native-async-storage/async-storage';

// Currency conversion utilities

export type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameLocal: Record<string, string>;
}

// Currency information
export const currencies: Record<Currency, CurrencyInfo> = {
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'CFA Franc',
    nameLocal: {
      fr: 'Franc CFA',
      en: 'CFA Franc',
      bm: 'Faransi CFA',
      es: 'Franco CFA',
      ar: 'فرنك أفريقي',
    },
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nameLocal: {
      fr: 'Euro',
      en: 'Euro',
      bm: 'Ero',
      es: 'Euro',
      ar: 'يورو',
    },
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nameLocal: {
      fr: 'Dollar US',
      en: 'US Dollar',
      bm: 'Dolar Ameriki',
      es: 'Dólar Estadounidense',
      ar: 'دولار أمريكي',
    },
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    nameLocal: {
      fr: 'Livre Sterling',
      en: 'British Pound',
      bm: 'Livri Angilɛ',
      es: 'Libra Esterlina',
      ar: 'جنيه إسترليني',
    },
  },
};

// Fixed exchange rates (base: EUR)
// In production, these should be fetched from an API
const exchangeRates: Record<Currency, number> = {
  EUR: 1,
  XOF: 655.957, // 1 EUR = 655.957 XOF (fixed rate)
  USD: 1.08,    // 1 EUR ≈ 1.08 USD
  GBP: 0.85,    // 1 EUR ≈ 0.85 GBP
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Convert to EUR first, then to target currency
  const amountInEUR = amount / exchangeRates[fromCurrency];
  const convertedAmount = amountInEUR * exchangeRates[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100;
};

// Format amount with currency symbol
export const formatCurrency = (
  amount: number,
  currency: Currency,
  locale: string = 'fr-FR'
): string => {
  const currencyInfo = currencies[currency];
  
  // For XOF, format without decimals
  if (currency === 'XOF') {
    return `${Math.round(amount).toLocaleString(locale)} ${currencyInfo.symbol}`;
  }
  
  // For other currencies, format with 2 decimals
  return `${amount.toFixed(2).replace('.', ',')} ${currencyInfo.symbol}`;
};

// Get currency name in specific language
export const getCurrencyName = (currency: Currency, language: string): string => {
  return currencies[currency].nameLocal[language] || currencies[currency].name;
};

// Load saved currency preference
export const loadCurrencyPreference = async (): Promise<Currency> => {
  try {
    const savedCurrency = await AsyncStorage.getItem('app_currency');
    if (savedCurrency && currencies[savedCurrency as Currency]) {
      return savedCurrency as Currency;
    }
  } catch (error) {
    console.error('[Currency] Error loading currency preference:', error);
  }
  // Default to XOF (local currency for Mali)
  return 'XOF';
};

// Save currency preference
export const saveCurrencyPreference = async (currency: Currency): Promise<void> => {
  try {
    await AsyncStorage.setItem('app_currency', currency);
    console.log('[Currency] Currency preference saved:', currency);
  } catch (error) {
    console.error('[Currency] Error saving currency preference:', error);
  }
};
