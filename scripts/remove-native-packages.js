/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const toRemove = [
  // Firebase
  '@react-native-firebase/app',
  '@react-native-firebase/firestore',
  // OneSignal
  'react-native-onesignal',
  'onesignal-expo-plugin',
  // Date picker
  '@react-native-community/datetimepicker',
  // Maps
  'react-native-maps',
  // QR Code
  'react-native-qrcode-svg',
  // Worklets / Reanimated
  'react-native-worklets',
  'react-native-worklets-core',
  'react-native-reanimated',
  // Gesture handler
  'react-native-gesture-handler',
  // Edge to edge
  'react-native-edge-to-edge',
  // Safe area / screens / svg / webview / css-interop
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-svg',
  'react-native-webview',
  'react-native-css-interop',
  // Expo native-only
  'expo-blur',
  'expo-symbols',
  // Google ads
  '@react-native-google-mobile-ads',
];

let changed = false;
for (const pkg_name of toRemove) {
  if (pkg.dependencies && pkg.dependencies[pkg_name]) {
    delete pkg.dependencies[pkg_name];
    changed = true;
    console.log(`Removed: ${pkg_name}`);
  } else if (pkg.devDependencies && pkg.devDependencies[pkg_name]) {
    delete pkg.devDependencies[pkg_name];
    changed = true;
    console.log(`Removed (dev): ${pkg_name}`);
  } else {
    console.log(`Not found (already removed?): ${pkg_name}`);
  }
}

if (changed) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('package.json updated successfully');
} else {
  console.log('No changes needed');
}

// ---------------------------------------------------------------------------
// Patch node_modules package.json files to remove the "react-native" field
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

for (const pkgName of nativePackagesToPatch) {
  try {
    const pkgJsonPath = path.join(__dirname, '..', 'node_modules', pkgName, 'package.json');
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
        console.log(`Patched node_modules/${pkgName} - removed "react-native" field`);
      } else {
        console.log(`node_modules/${pkgName} - already patched`);
      }
    } else {
      console.log(`node_modules/${pkgName} - not found, skipping`);
    }
  } catch (e) {
    console.error(`Failed to patch node_modules/${pkgName}:`, e.message);
  }
}
