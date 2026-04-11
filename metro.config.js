const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// CRITICAL: Must be false on web to prevent native package exports from resolving
// native-only entry points (which crash/hang the web preview).
config.resolver.unstable_enablePackageExports = false;

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

// ---------------------------------------------------------------------------
// Stub redirects — redirect native-only packages to web-safe stubs.
// This runs for ALL platforms; stubs are designed to be no-ops on native too.
// ---------------------------------------------------------------------------
const STUB_DIR = path.join(__dirname, 'stubs');

const NATIVE_PACKAGE_STUBS = {
  // Firebase
  '@react-native-firebase/app': path.join(STUB_DIR, 'firebase-app-stub.js'),
  '@react-native-firebase/firestore': path.join(STUB_DIR, 'firebase-firestore-stub.js'),
  // OneSignal
  'react-native-onesignal': path.join(STUB_DIR, 'onesignal-stub.js'),
  // Date picker
  '@react-native-community/datetimepicker': path.join(STUB_DIR, 'datetimepicker-stub.js'),
  // Maps
  'react-native-maps': path.join(STUB_DIR, 'maps-stub.js'),
  // QR Code
  'react-native-qrcode-svg': path.join(STUB_DIR, 'qrcode-stub.js'),
  // Worklets / Reanimated
  'react-native-worklets': path.join(STUB_DIR, 'worklets-stub.js'),
  'react-native-worklets-core': path.join(STUB_DIR, 'worklets-stub.js'),
  // Gesture handler
  'react-native-gesture-handler': path.join(STUB_DIR, 'gesture-handler-stub.js'),
  // Edge to edge
  'react-native-edge-to-edge': path.join(STUB_DIR, 'edge-to-edge-stub.js'),
  // Safe area / screens / svg / webview / css-interop
  'react-native-screens': path.join(STUB_DIR, 'react-native-screens-stub.js'),
  'react-native-safe-area-context': path.join(STUB_DIR, 'react-native-safe-area-context-stub.js'),
  'react-native-svg': path.join(STUB_DIR, 'react-native-svg-stub.js'),
  'react-native-webview': path.join(STUB_DIR, 'react-native-webview-stub.js'),
  'react-native-css-interop': path.join(STUB_DIR, 'react-native-css-interop-stub.js'),
  // Expo native-only
  'expo-blur': path.join(STUB_DIR, 'expo-blur-stub.js'),
  'expo-symbols': path.join(STUB_DIR, 'expo-symbols-stub.js'),
  'expo-haptics': path.join(STUB_DIR, 'expo-haptics-stub.js'),
  'expo-camera': path.join(STUB_DIR, 'expo-camera-stub.js'),
  'expo-media-library': path.join(STUB_DIR, 'expo-media-library-stub.js'),
  'expo-notifications': path.join(STUB_DIR, 'expo-notifications-stub.js'),
  'expo-video': path.join(STUB_DIR, 'expo-video-stub.js'),
  'expo-glass-effect': path.join(STUB_DIR, 'expo-glass-effect-stub.js'),
  // Google AdMob — disabled completely
  '@react-native-google-mobile-ads': path.join(STUB_DIR, 'admob-stub.js'),
  'expo-ads-admob': path.join(STUB_DIR, 'admob-stub.js'),
  // AsyncStorage — use our web-safe implementation
  '@react-native-async-storage/async-storage': path.join(__dirname, 'lib', 'async-storage.ts'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only redirect on web platform
  if (platform === 'web' && NATIVE_PACKAGE_STUBS[moduleName]) {
    const stubPath = NATIVE_PACKAGE_STUBS[moduleName];
    if (fs.existsSync(stubPath)) {
      return { filePath: stubPath, type: 'sourceFile' };
    }
  }
  // Fall through to default resolution
  return context.resolveRequest(context, moduleName, platform);
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
