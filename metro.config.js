const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Patch native packages at Metro startup to remove "react-native" field
// that triggers "Native package detected" in Specular preview
// ---------------------------------------------------------------------------
const nativePackagesToPatch = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-webview',
  'react-native-css-interop',
  'react-native-url-polyfill',
  '@react-native-async-storage/async-storage',
];

for (const pkg of nativePackagesToPatch) {
  try {
    const pkgJsonPath = path.join(__dirname, 'node_modules', pkg, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      let modified = false;
      if (pkgJson['react-native']) {
        delete pkgJson['react-native'];
        modified = true;
      }
      if (pkgJson['react-native-src']) {
        delete pkgJson['react-native-src'];
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
        console.log(`[metro] Patched ${pkg} - removed "react-native" field`);
      }
    }
  } catch (e) {
    // ignore
  }
}

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// ---------------------------------------------------------------------------
// Redirect native packages to web-safe stubs.
// This runs at bundle time so native modules never load in the web preview.
// ---------------------------------------------------------------------------
const STUB_MAP = {
  // Firebase
  '@react-native-firebase/app':       path.join(__dirname, 'stubs/firebase-app-stub.js'),
  '@react-native-firebase/firestore': path.join(__dirname, 'stubs/firebase-firestore-stub.js'),
  // OneSignal
  'react-native-onesignal':           path.join(__dirname, 'stubs/onesignal-stub.js'),
  'onesignal-expo-plugin':            path.join(__dirname, 'stubs/onesignal-stub.js'),
  // Maps
  'react-native-maps':                path.join(__dirname, 'stubs/maps-stub.js'),
  // QR Code
  'react-native-qrcode-svg':          path.join(__dirname, 'stubs/qrcode-stub.js'),
  // Worklets / Reanimated
  'react-native-worklets-core':       path.join(__dirname, 'stubs/worklets-stub.js'),
  'react-native-worklets':            path.join(__dirname, 'stubs/worklets-stub.js'),
  'react-native-reanimated':          path.join(__dirname, 'stubs/worklets-stub.js'),
  // Gesture handler
  'react-native-gesture-handler':     path.join(__dirname, 'stubs/gesture-handler-stub.js'),
  // Edge to edge
  'react-native-edge-to-edge':        path.join(__dirname, 'stubs/edge-to-edge-stub.js'),
  // Safe area / screens / svg / webview / css-interop / url-polyfill
  'react-native-screens':             path.join(__dirname, 'stubs/packages/react-native-screens/index.js'),
  'react-native-safe-area-context':   path.join(__dirname, 'stubs/packages/react-native-safe-area-context/index.js'),
  'react-native-svg':                 path.join(__dirname, 'stubs/packages/react-native-svg/index.js'),
  'react-native-webview':             path.join(__dirname, 'stubs/packages/react-native-webview/index.js'),
  'react-native-css-interop':         path.join(__dirname, 'stubs/packages/react-native-css-interop/index.js'),
  'react-native-url-polyfill':        path.join(__dirname, 'stubs/packages/react-native-url-polyfill/index.js'),
  // AsyncStorage
  '@react-native-async-storage/async-storage': path.join(__dirname, 'stubs/packages/@react-native-async-storage/async-storage/index.js'),
  // DateTimePicker
  '@react-native-community/datetimepicker': path.join(__dirname, 'stubs/datetimepicker-stub.js'),
  // Expo native-only packages
  'expo-haptics':                     path.join(__dirname, 'stubs/expo-haptics-stub.js'),
  'expo-camera':                      path.join(__dirname, 'stubs/expo-camera-stub.js'),
  'expo-media-library':               path.join(__dirname, 'stubs/expo-media-library-stub.js'),
  'expo-video':                       path.join(__dirname, 'stubs/expo-video-stub.js'),
  'expo-notifications':               path.join(__dirname, 'stubs/expo-notifications-stub.js'),
  'expo-glass-effect':                path.join(__dirname, 'stubs/expo-glass-effect-stub.js'),
  'expo-blur':                        path.join(__dirname, 'stubs/expo-blur-stub.js'),
  'expo-symbols':                     path.join(__dirname, 'stubs/expo-symbols-stub.js'),
  // Google ads
  '@react-native-google-mobile-ads':  path.join(__dirname, 'stubs/onesignal-stub.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exact match
  if (STUB_MAP[moduleName]) {
    return { filePath: STUB_MAP[moduleName], type: 'sourceFile' };
  }
  // Prefix match (e.g. react-native-svg/src/...)
  for (const [pkg, stub] of Object.entries(STUB_MAP)) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      return { filePath: stub, type: 'sourceFile' };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// ---------------------------------------------------------------------------
// Custom server middleware to receive console.log messages from the app
// ---------------------------------------------------------------------------
const LOG_FILE_PATH = path.join(__dirname, '.natively', 'app_console.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

const logDir = path.dirname(LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url.includes('index.bundle') || req.url.includes('.bundle')) {
      console.log('[METRO] Request:', req.method, req.url);
    }

    const pathname = req.url.split('?')[0];

    if (pathname === '/natively-logs' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
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
          try {
            if (fs.existsSync(LOG_FILE_PATH) && fs.statSync(LOG_FILE_PATH).size > MAX_LOG_SIZE) {
              const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
              const lines = content.split('\n');
              fs.writeFileSync(LOG_FILE_PATH, lines.slice(lines.length / 2).join('\n'));
            }
          } catch (e) {}
          fs.appendFileSync(LOG_FILE_PATH, logLine);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end('{"status":"ok"}');
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (pathname === '/natively-logs' && req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return;
    }

    return middleware(req, res, next);
  };
};

module.exports = config;
