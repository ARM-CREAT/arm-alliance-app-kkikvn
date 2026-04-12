const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const stubsDir = path.resolve(__dirname, 'stubs');

const MODULE_STUBS = {
  // Firebase
  'firebase/app': path.join(stubsDir, 'firebase-app-stub.js'),
  'firebase/firestore': path.join(stubsDir, 'firebase-firestore-stub.js'),
  // Auth
  'better-auth': path.join(stubsDir, 'better-auth-client-stub.js'),
  'better-auth/client': path.join(stubsDir, 'better-auth-client-stub.js'),
  'better-auth/react': path.join(stubsDir, 'better-auth-client-stub.js'),
  '@better-auth/expo': path.join(stubsDir, 'better-auth-client-stub.js'),
  '@better-auth/expo/client': path.join(stubsDir, 'better-auth-client-stub.js'),
  // Async Storage
  '@react-native-async-storage/async-storage': path.join(stubsDir, 'async-storage-stub.js'),
  // Native modules
  'expo-haptics': path.join(stubsDir, 'expo-haptics-stub.js'),
  'expo-camera': path.join(stubsDir, 'expo-camera-stub.js'),
  'expo-image-picker': path.join(stubsDir, 'expo-image-picker-stub.js'),
  'expo-document-picker': path.join(stubsDir, 'expo-document-picker-stub.js'),
  'expo-clipboard': path.join(stubsDir, 'expo-clipboard-stub.js'),
  'expo-media-library': path.join(stubsDir, 'expo-media-library-stub.js'),
  'expo-notifications': path.join(stubsDir, 'expo-notifications-stub.js'),
  'expo-video': path.join(stubsDir, 'expo-video-stub.js'),
  'react-native-maps': path.join(stubsDir, 'maps-stub.js'),
  'react-native-google-mobile-ads': path.join(stubsDir, 'admob-stub.js'),
  'onesignal-expo-plugin': path.join(stubsDir, 'onesignal-stub.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (MODULE_STUBS[moduleName]) {
    return { filePath: MODULE_STUBS[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
