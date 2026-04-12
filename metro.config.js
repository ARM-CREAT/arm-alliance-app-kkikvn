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

// ─── Web-safe stub mappings ───────────────────────────────────────────────────
// On web, native-only packages are redirected to no-op stubs so the bundler
// never tries to evaluate native modules that crash the web module graph.
const STUBS = path.join(__dirname, 'stubs');

config.resolver.extraNodeModules = {
  // Auth
  'better-auth':                          path.join(STUBS, 'better-auth-client-stub.js'),
  'better-auth/client':                   path.join(STUBS, 'better-auth-client-stub.js'),
  'better-auth/react':                    path.join(STUBS, 'better-auth-client-stub.js'),
  '@better-auth/expo':                    path.join(STUBS, 'better-auth-client-stub.js'),
  '@better-auth/expo/client':             path.join(STUBS, 'better-auth-client-stub.js'),

  // Storage
  '@react-native-async-storage/async-storage': path.join(STUBS, 'async-storage-stub.js'),

  // Firebase
  'firebase/app':                         path.join(STUBS, 'firebase-app-stub.js'),
  'firebase/firestore':                   path.join(STUBS, 'firebase-firestore-stub.js'),
  '@firebase/app':                        path.join(STUBS, 'firebase-app-stub.js'),
  '@firebase/firestore':                  path.join(STUBS, 'firebase-firestore-stub.js'),

  // Expo native modules
  'expo-camera':                          path.join(STUBS, 'expo-camera-stub.js'),
  'expo-clipboard':                       path.join(STUBS, 'expo-clipboard-stub.js'),
  'expo-document-picker':                 path.join(STUBS, 'expo-document-picker-stub.js'),
  'expo-haptics':                         path.join(STUBS, 'expo-haptics-stub.js'),
  'expo-image-picker':                    path.join(STUBS, 'expo-image-picker-stub.js'),
  'expo-media-library':                   path.join(STUBS, 'expo-media-library-stub.js'),
  'expo-notifications':                   path.join(STUBS, 'expo-notifications-stub.js'),
  'expo-video':                           path.join(STUBS, 'expo-video-stub.js'),

  // Maps
  'react-native-maps':                    path.join(STUBS, 'maps-stub.js'),

  // Push notifications
  'react-native-onesignal':               path.join(STUBS, 'onesignal-stub.js'),
  'onesignal-expo-plugin':                path.join(STUBS, 'onesignal-stub.js'),

  // Ads
  'react-native-google-mobile-ads':       path.join(STUBS, 'admob-stub.js'),

  // Gesture handler / screens / safe area (web has its own implementations,
  // but stub prevents crashes if the native variant is accidentally imported)
  'react-native-gesture-handler':         path.join(STUBS, 'gesture-handler-stub.js'),
  'react-native-safe-area-context':       path.join(STUBS, 'react-native-safe-area-context-stub.js'),
  'react-native-screens':                 path.join(STUBS, 'react-native-screens-stub.js'),

  // Misc
  'expo-glass-effect':                    path.join(STUBS, 'expo-glass-effect-stub.js'),
  'react-native-url-polyfill':            path.join(STUBS, 'url-polyfill-stub.js'),
  'react-native-svg':                     path.join(STUBS, 'react-native-svg-stub.js'),
  'react-native-webview':                 path.join(STUBS, 'react-native-webview-stub.js'),
  'react-native-css-interop':             path.join(STUBS, 'react-native-css-interop-stub.js'),
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
