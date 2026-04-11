const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

// ---------------------------------------------------------------------------
// Stub aliases — map native-only packages to web-safe stubs so the preview
// renderer never tries to load native modules that crash on web.
// ---------------------------------------------------------------------------
const STUBS_DIR = path.join(__dirname, 'stubs');
const PACKAGES_STUBS_DIR = path.join(STUBS_DIR, 'packages');

config.resolver.extraNodeModules = {
  // Packages with full stub directories
  'react-native-safe-area-context': path.join(PACKAGES_STUBS_DIR, 'react-native-safe-area-context'),
  'react-native-screens': path.join(PACKAGES_STUBS_DIR, 'react-native-screens'),
  'react-native-svg': path.join(PACKAGES_STUBS_DIR, 'react-native-svg'),
  'react-native-webview': path.join(PACKAGES_STUBS_DIR, 'react-native-webview'),
  'react-native-css-interop': path.join(PACKAGES_STUBS_DIR, 'react-native-css-interop'),
  'react-native-url-polyfill': path.join(PACKAGES_STUBS_DIR, 'react-native-url-polyfill'),
  '@react-native-async-storage/async-storage': path.join(PACKAGES_STUBS_DIR, '@react-native-async-storage', 'async-storage'),

  // Firebase stubs — must be mapped so any transitive import of firebase/app or
  // firebase/firestore resolves to a no-op stub instead of crashing the web bundler.
  'firebase/app': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/firestore': path.join(STUBS_DIR, 'firebase-firestore-stub.js'),
  'firebase/auth': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/storage': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/functions': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/analytics': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/messaging': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  'firebase/database': path.join(STUBS_DIR, 'firebase-firestore-stub.js'),
  '@react-native-firebase/app': path.join(STUBS_DIR, 'firebase-app-stub.js'),
  '@react-native-firebase/firestore': path.join(STUBS_DIR, 'firebase-firestore-stub.js'),
  '@react-native-firebase/auth': path.join(STUBS_DIR, 'firebase-app-stub.js'),

  // Single-file stubs
  'expo-video': path.join(STUBS_DIR, 'expo-video-stub.js'),
  'expo-haptics': path.join(STUBS_DIR, 'expo-haptics-stub.js'),
  'expo-camera': path.join(STUBS_DIR, 'expo-camera-stub.js'),
  'expo-blur': path.join(STUBS_DIR, 'expo-blur-stub.js'),
  'expo-symbols': path.join(STUBS_DIR, 'expo-symbols-stub.js'),
  'expo-notifications': path.join(STUBS_DIR, 'expo-notifications-stub.js'),
  'expo-media-library': path.join(STUBS_DIR, 'expo-media-library-stub.js'),
  'expo-glass-effect': path.join(STUBS_DIR, 'expo-glass-effect-stub.js'),
  'react-native-onesignal': path.join(STUBS_DIR, 'onesignal-stub.js'),
  'react-native-gesture-handler': path.join(STUBS_DIR, 'gesture-handler-stub.js'),
  'react-native-reanimated': path.join(STUBS_DIR, 'worklets-stub.js'),
  'react-native-maps': path.join(STUBS_DIR, 'maps-stub.js'),
  '@react-native-community/datetimepicker': path.join(STUBS_DIR, 'datetimepicker-stub.js'),
  'react-native-qrcode-svg': path.join(STUBS_DIR, 'qrcode-stub.js'),
  'react-native-edge-to-edge': path.join(STUBS_DIR, 'edge-to-edge-stub.js'),
  'react-native-google-mobile-ads': path.join(STUBS_DIR, 'admob-stub.js'),
  '@react-native-google-mobile-ads': path.join(STUBS_DIR, 'admob-stub.js'),
  'better-auth': path.join(STUBS_DIR, 'better-auth-client-stub.js'),
  '@better-auth/expo': path.join(STUBS_DIR, 'better-auth-client-stub.js'),
  'expo-image-picker': path.join(STUBS_DIR, 'expo-image-picker-stub.js'),
  'expo-document-picker': path.join(STUBS_DIR, 'expo-document-picker-stub.js'),
  'expo-clipboard': path.join(STUBS_DIR, 'expo-clipboard-stub.js'),
};

// Custom server middleware to receive console.log messages from the app
const LOG_FILE_PATH = path.join(__dirname, '.natively', 'app_console.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {

    // DEBUG: log all metro bundle requests
    if (req.url.includes('index.bundle') || req.url.includes('.bundle')) {
      console.log('[METRO] Request:', req.method, req.url);
    }

    // Extract pathname without query params for matching
    const pathname = req.url.split('?')[0];

    // Handle log receiving endpoint
    if (pathname === '/natively-logs' && req.method === 'POST') {
      console.log('[NATIVELY-LOGS] Received POST request');
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const logData = JSON.parse(body);
          const timestamp = logData.timestamp || new Date().toISOString();
          const level = (logData.level || 'log').toUpperCase();
          const message = logData.message || '';
          const source = logData.source || '';
          const platform = logData.platform || '';

          const platformInfo = platform ? `[${platform}] ` : '';
          const sourceInfo = source ? `[${source}] ` : '';
          const logLine = `[${timestamp}] ${platformInfo}[${level}] ${sourceInfo}${message}\n`;

          console.log('[NATIVELY-LOGS] Writing log:', logLine.trim());

          // Rotate log file if too large
          try {
            if (fs.existsSync(LOG_FILE_PATH) && fs.statSync(LOG_FILE_PATH).size > MAX_LOG_SIZE) {
              const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
              const lines = content.split('\n');
              fs.writeFileSync(LOG_FILE_PATH, lines.slice(lines.length / 2).join('\n'));
            }
          } catch (e) {
            // Ignore rotation errors
          }

          fs.appendFileSync(LOG_FILE_PATH, logLine);

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end('{"status":"ok"}');
        } catch (e) {
          console.error('[NATIVELY-LOGS] Error processing log:', e.message);
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Handle CORS preflight for log endpoint
    if (pathname === '/natively-logs' && req.method === 'OPTIONS') {
      console.log('[NATIVELY-LOGS] Received OPTIONS preflight request');
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    // Pass through to default Metro middleware
    return middleware(req, res, next);
  };
};

module.exports = config;
