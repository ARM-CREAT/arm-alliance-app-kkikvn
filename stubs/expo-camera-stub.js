// Stub for expo-camera — no-op on web/preview
const React = require('react');
const { View, Text } = require('react-native');
const CameraView = ({ style, children }) =>
  React.createElement(View, { style: [{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', minHeight: 200 }, style] },
    React.createElement(Text, { style: { color: '#fff', fontSize: 14 } }, 'Caméra non disponible'),
    children
  );
const Camera = CameraView;
const useCameraPermissions = () => [{ granted: false }, async () => ({ granted: false })];
const CameraType = { front: 'front', back: 'back' };
const FlashMode = { on: 'on', off: 'off', auto: 'auto' };
module.exports = { CameraView, Camera, useCameraPermissions, CameraType, FlashMode };
module.exports.default = CameraView;
