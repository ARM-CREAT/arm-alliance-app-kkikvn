const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// NOTE: unstable_enablePackageExports is intentionally disabled.
// Enabling it causes Metro to follow the `exports` field in package.json,
// which bypasses the web stub resolver for packages with complex export maps
// and can produce blank screens or module-not-found crashes on web.

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// ─── Web stub resolver ────────────────────────────────────────────────────────
// On web, native packages crash the module graph. Map them to lightweight stubs.
const STUBS = path.join(__dirname, 'stubs');

const WEB_STUBS = {
  // Reanimated / worklets
  'react-native-reanimated':                          path.join(STUBS, 'worklets-stub.js'),
  'react-native-worklets-core':                       path.join(STUBS, 'worklets-stub.js'),

  // OneSignal
  '@onesignal/react-native-onesignal':                path.join(STUBS, 'onesignal-stub.js'),

  // Expo native modules
  'expo-notifications':                               path.join(STUBS, 'expo-notifications-stub.js'),
  'expo-haptics':                                     path.join(STUBS, 'expo-haptics-stub.js'),
  'expo-camera':                                      path.join(STUBS, 'expo-camera-stub.js'),
  'expo-blur':                                        path.join(STUBS, 'expo-blur-stub.js'),
  'expo-symbols':                                     path.join(STUBS, 'expo-symbols-stub.js'),
  'expo-video':                                       path.join(STUBS, 'expo-video-stub.js'),
  'expo-media-library':                               path.join(STUBS, 'expo-media-library-stub.js'),
  'expo-glass-effect':                                path.join(STUBS, 'expo-glass-effect-stub.js'),

  // Maps
  'react-native-maps':                                path.join(STUBS, 'maps-stub.js'),

  // AsyncStorage
  '@react-native-async-storage/async-storage':        path.join(STUBS, 'async-storage-stub.js'),

  // Safe area / screens / gesture / svg / webview / url-polyfill
  'react-native-safe-area-context':                   path.join(STUBS, 'react-native-safe-area-context-stub.js'),
  'react-native-screens':                             path.join(STUBS, 'react-native-screens-stub.js'),
  'react-native-gesture-handler':                     path.join(STUBS, 'gesture-handler-stub.js'),
  'react-native-svg':                                 path.join(STUBS, 'react-native-svg-stub.js'),
  'react-native-webview':                             path.join(STUBS, 'react-native-webview-stub.js'),
  'react-native-css-interop':                         path.join(STUBS, 'react-native-css-interop-stub.js'),

  // Date picker
  '@react-native-community/datetimepicker':           path.join(STUBS, 'datetimepicker-stub.js'),

  // Edge to edge
  'react-native-edge-to-edge':                        path.join(STUBS, 'edge-to-edge-stub.js'),

  // Firebase
  '@react-native-firebase/app':                       path.join(STUBS, 'firebase-app-stub.js'),
  '@react-native-firebase/firestore':                 path.join(STUBS, 'firebase-firestore-stub.js'),

  // AdMob
  'react-native-google-mobile-ads':                   path.join(STUBS, 'admob-stub.js'),

  // QR code
  'react-native-qrcode-svg':                          path.join(STUBS, 'qrcode-stub.js'),

  // Drawer navigator — imports reanimated/gesture-handler at eval time, must be stubbed on web
  '@react-navigation/drawer':                         path.join(STUBS, 'drawer-stub.js'),

  // URL polyfill — web has native URL, no polyfill needed
  'react-native-url-polyfill':                        path.join(STUBS, 'url-polyfill-stub.js'),
};

// Packages that should use the better-auth stub (matched by prefix)
const BETTER_AUTH_PREFIXES = [
  'better-auth',
  '@better-auth',
];

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Exact match stubs
    if (WEB_STUBS[moduleName]) {
      return { filePath: WEB_STUBS[moduleName], type: 'sourceFile' };
    }

    // Subpath match for all WEB_STUBS packages
    // e.g. 'react-native-reanimated/src/Animated' → worklets-stub.js
    for (const [pkg, stubPath] of Object.entries(WEB_STUBS)) {
      if (moduleName.startsWith(pkg + '/') || moduleName.startsWith(pkg + '\\')) {
        return { filePath: stubPath, type: 'sourceFile' };
      }
    }

    // better-auth family — all subpaths stubbed
    for (const prefix of BETTER_AUTH_PREFIXES) {
      if (
        moduleName === prefix ||
        moduleName.startsWith(prefix + '/') ||
        moduleName.startsWith(prefix + '\\')
      ) {
        return { filePath: path.join(STUBS, 'better-auth-client-stub.js'), type: 'sourceFile' };
      }
    }
  }

  // Fall through to default resolver
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ─── Custom server middleware ─────────────────────────────────────────────────
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
