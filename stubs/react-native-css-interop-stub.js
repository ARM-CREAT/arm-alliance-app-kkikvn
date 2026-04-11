// Stub for react-native-css-interop — no-op on web/preview
const cssInterop = (_component, _mapping) => _component;
const remapProps = (_component, _mapping) => _component;
const useColorScheme = () => ({ colorScheme: 'light', setColorScheme: () => {} });
module.exports = { cssInterop, remapProps, useColorScheme };
module.exports.default = module.exports;
