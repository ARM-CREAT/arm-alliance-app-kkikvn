/* eslint-disable react/prop-types */
const React = require('react');
const { View, Text } = require('react-native');
const QRCode = ({ value, size = 100, color = '#000', backgroundColor = '#fff' }) =>
  React.createElement(View, {
    style: { width: size, height: size, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc' },
  }, React.createElement(Text, { style: { fontSize: 9, color: '#666', textAlign: 'center', padding: 4 } }, 'QR'));
module.exports = QRCode;
module.exports.default = QRCode;
