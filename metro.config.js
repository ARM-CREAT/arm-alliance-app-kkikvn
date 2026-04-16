const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

// Force cache reset by changing this version number
config.cacheVersion = 'v10';

config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Exclude Node.js/webpack-only packages that cannot be bundled by Metro
config.resolver.blockList = [
  /node_modules\/workbox-cli\/.*/,
  /node_modules\/workbox-webpack-plugin\/.*/,
  /node_modules\/webpack-cli\/.*/,
  /node_modules\/workbox-precaching\/.*/,
  /node_modules\/react-native-css-interop\/.*/,
  /node_modules\/expo-glass-effect\/.*/,
  /node_modules\/eas\/.*/,
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

module.exports = config;
