import { Platform } from 'react-native';

declare const __DEV__: boolean;

export function setupErrorLogging() {
  // no-op on native
}

export function logError(error: unknown, context?: string) {
  if (__DEV__) {
    console.warn('[ErrorLogger]', context, error);
  }
}

export default { setupErrorLogging, logError };
