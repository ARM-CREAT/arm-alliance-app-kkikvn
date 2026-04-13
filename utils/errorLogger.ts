// Global error logging — web only.
// On native (Android/iOS), this module is a complete no-op to avoid any
// performance overhead or fetch calls that could freeze the UI thread.

import { Platform } from 'react-native';

// Safe __DEV__ guard — the variable may not exist in all bundler configs
const isDev: boolean = (() => {
  try {
    return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  } catch {
    return false;
  }
})();

// ─── No-op helpers (always safe to call) ────────────────────────────────────

export function logError(error: unknown, context?: string): void {
  try {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Error]', context || '', msg);
  } catch {}
}

export function logInfo(message: string, data?: unknown): void {
  try {
    if (isDev) console.log('[Info]', message, data ?? '');
  } catch {}
}

// ─── setupErrorLogging ───────────────────────────────────────────────────────

export function setupErrorLogging(): void {
  // Native: absolute no-op — never intercept console methods on Android/iOS.
  // Stack trace generation (new Error().stack) on Hermes is extremely expensive
  // and can freeze the UI thread, causing a permanent blank white screen.
  if (Platform.OS !== 'web') return;

  // Web only — deferred so the root layout renders first
  if (!isDev) return;

  setTimeout(() => {
    try {
      const originalLog = console.log.bind(console);
      const originalWarn = console.warn.bind(console);
      const originalError = console.error.bind(console);

      const MUTED = [
        'each child in a list should have a unique "key" prop',
        'Each child in a list should have a unique "key" prop',
      ];
      const shouldMute = (msg: string) => MUTED.some(m => msg.includes(m));

      const getLogUrl = (): string | null => {
        try {
          if (typeof window !== 'undefined') {
            return `${window.location.origin}/natively-logs`;
          }
        } catch {}
        return null;
      };

      const logUrl = getLogUrl();
      if (!logUrl) return;

      let fetchErrorLogged = false;
      const sendLog = (level: string, message: string) => {
        try {
          fetch(logUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level,
              message,
              source: '',
              timestamp: new Date().toISOString(),
              platform: 'Web',
            }),
          }).catch((e: unknown) => {
            if (!fetchErrorLogged) {
              fetchErrorLogged = true;
              const msg = e instanceof Error ? e.message : String(e);
              originalWarn('[Newly] Log fetch error (will not repeat):', msg);
            }
          });
        } catch {}
      };

      const stringify = (args: unknown[]) =>
        args.map(a => {
          if (typeof a === 'string') return a;
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          try { return JSON.stringify(a); } catch { return String(a); }
        }).join(' ');

      console.log = (...args: unknown[]) => {
        originalLog(...args);
        sendLog('log', stringify(args));
      };

      console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        const msg = stringify(args);
        if (!shouldMute(msg)) sendLog('warn', msg);
      };

      console.error = (...args: unknown[]) => {
        originalError(...args);
        const msg = stringify(args);
        if (!shouldMute(msg)) sendLog('error', msg);
      };

      // Unhandled promise rejections (web only)
      window.addEventListener('unhandledrejection', (event) => {
        sendLog('error', `UNHANDLED PROMISE REJECTION: ${event.reason}`);
      });

      // Send errors to parent iframe
      window.onerror = (message, source, lineno, colno, error) => {
        const sourceFile = source ? source.split('/').pop() : 'unknown';
        sendLog('error', `RUNTIME ERROR: ${message} at ${sourceFile}:${lineno}:${colno}`);
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'EXPO_ERROR',
              level: 'error',
              message: String(message),
              data: { source: `${sourceFile}:${lineno}:${colno}`, error: error?.stack },
              timestamp: new Date().toISOString(),
              source: 'expo-template',
            }, '*');
          }
        } catch {}
        return false;
      };
    } catch {}
  }, 2000);
}

// Auto-initialize on web only — safe __DEV__ guard
if (Platform.OS === 'web' && isDev) {
  setTimeout(setupErrorLogging, 100);
}

export default { setupErrorLogging, logError, logInfo };
