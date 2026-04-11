// Stub for react-native-webview — no-op on web/preview
/* eslint-disable react/prop-types */
const React = require('react');
const { View, Text } = require('react-native');
const WebView = ({ style }) =>
  React.createElement(View, { style: [{ backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', minHeight: 200 }, style] },
    React.createElement(Text, { style: { color: '#666', fontSize: 14 } }, 'WebView non disponible')
  );
module.exports = WebView;
module.exports.default = WebView;
module.exports.WebView = WebView;
