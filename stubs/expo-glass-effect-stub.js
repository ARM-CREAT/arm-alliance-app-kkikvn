// Stub for expo-glass-effect — no-op on web/preview
const React = require('react');
const { View } = require('react-native');
const GlassView = ({ style, children, ...props }) =>
  React.createElement(View, { style, ...props }, children);
module.exports = { GlassView };
module.exports.default = GlassView;
