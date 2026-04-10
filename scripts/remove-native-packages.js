/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const toRemove = [
  '@react-native-firebase/app',
  '@react-native-firebase/firestore',
  'react-native-onesignal',
  'onesignal-expo-plugin',
  '@react-native-community/datetimepicker',
];

let changed = false;
for (const pkg_name of toRemove) {
  if (pkg.dependencies && pkg.dependencies[pkg_name]) {
    delete pkg.dependencies[pkg_name];
    changed = true;
    console.log(`Removed: ${pkg_name}`);
  }
}

if (changed) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('package.json updated successfully');
} else {
  console.log('No changes needed');
}
