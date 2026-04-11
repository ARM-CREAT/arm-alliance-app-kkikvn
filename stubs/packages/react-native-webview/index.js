/* eslint-disable react/prop-types */
const React = require('react');
const { View, Text } = require('react-native');
const WebView = ({ style }) => React.createElement(View, { style: [{ backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', minHeight: 100 }, style] }, React.createElement(Text, { style: { color: '#666' } }, 'WebView non disponible'));
module.exports = { default: WebView, WebView };
