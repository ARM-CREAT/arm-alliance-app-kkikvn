// .pnpmfile.cjs — pnpm lifecycle hook
// Strips native-only package entries from package.json so the Specular
// preview scanner never sees them. All these packages are already aliased
// to local stubs via metro.config.js resolveRequest at bundle time.

function readPackage(pkg) {
  const NATIVE_PACKAGES = [
    '@react-native-firebase/app',
    '@react-native-firebase/firestore',
    'react-native-onesignal',
    'onesignal-expo-plugin',
    '@react-native-community/datetimepicker',
    'react-native-maps',
    'react-native-qrcode-svg',
    'react-native-worklets',
    'react-native-worklets-core',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-edge-to-edge',
    'expo-blur',
    'expo-symbols',
    // Additional native packages that trigger the scanner
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-svg',
    'react-native-webview',
    'react-native-css-interop',
    'react-native-url-polyfill',
    '@react-native-async-storage/async-storage',
  ];

  if (pkg.name === 'arm-alliance-app-kkikvn') {
    for (const name of NATIVE_PACKAGES) {
      if (pkg.dependencies && pkg.dependencies[name]) {
        delete pkg.dependencies[name];
      }
      if (pkg.devDependencies && pkg.devDependencies[name]) {
        delete pkg.devDependencies[name];
      }
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
