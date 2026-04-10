const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@react-native-community/datetimepicker': path.resolve(__dirname, 'stubs/datetimepicker-stub.js'),
  '@react-native-firebase/app': path.resolve(__dirname, 'stubs/firebase-app-stub.js'),
  '@react-native-firebase/firestore': path.resolve(__dirname, 'stubs/firebase-firestore-stub.js'),
  'onesignal-expo-plugin': path.resolve(__dirname, 'stubs/onesignal-stub.js'),
  'react-native-maps': path.resolve(__dirname, 'stubs/maps-stub.js'),
  'react-native-onesignal': path.resolve(__dirname, 'stubs/onesignal-stub.js'),
  'react-native-qrcode-svg': path.resolve(__dirname, 'stubs/qrcode-stub.js'),
  'react-native-worklets': path.resolve(__dirname, 'stubs/worklets-stub.js'),
};

config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

module.exports = config;

