const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Map native-only packages to existing stubs so the web/preview bundle never
// tries to load native modules that aren't available in that environment.
config.resolver.extraNodeModules = {
  '@react-native-async-storage/async-storage': require.resolve('./stubs/async-storage-stub.js'),
  '@react-native-firebase/app': require.resolve('./stubs/firebase-app-stub.js'),
  '@react-native-firebase/firestore': require.resolve('./stubs/firebase-firestore-stub.js'),
  '@react-native-google-mobile-ads': require.resolve('./stubs/admob-stub.js'),
  'react-native-onesignal': require.resolve('./stubs/onesignal-stub.js'),
  '@react-native-community/datetimepicker': require.resolve('./stubs/datetimepicker-stub.js'),
  'react-native-maps': require.resolve('./stubs/maps-stub.js'),
  'react-native-qrcode-svg': require.resolve('./stubs/qrcode-stub.js'),
  'react-native-worklets': require.resolve('./stubs/worklets-stub.js'),
  'react-native-worklets-core': require.resolve('./stubs/worklets-stub.js'),
  'react-native-gesture-handler': require.resolve('./stubs/gesture-handler-stub.js'),
  'react-native-edge-to-edge': require.resolve('./stubs/edge-to-edge-stub.js'),
  'react-native-screens': require.resolve('./stubs/react-native-screens-stub.js'),
  'react-native-safe-area-context': require.resolve('./stubs/react-native-safe-area-context-stub.js'),
  'react-native-svg': require.resolve('./stubs/react-native-svg-stub.js'),
  'react-native-webview': require.resolve('./stubs/react-native-webview-stub.js'),
  'react-native-css-interop': require.resolve('./stubs/react-native-css-interop-stub.js'),
  'react-native-url-polyfill': require.resolve('./stubs/url-polyfill-stub.js'),
  'expo-blur': require.resolve('./stubs/expo-blur-stub.js'),
  'expo-symbols': require.resolve('./stubs/expo-symbols-stub.js'),
  '@react-navigation/drawer': require.resolve('./stubs/drawer-stub.js'),
};

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

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
    // Extract pathname without query params for matching
    const pathname = req.url.split('?')[0];

    // Handle log receiving endpoint
    if (pathname === '/natively-logs' && req.method === 'POST') {
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
