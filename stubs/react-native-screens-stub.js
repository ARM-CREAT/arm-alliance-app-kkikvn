// Stub for react-native-screens — no-op on web/preview
/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');
const Screen = ({ children, style, ...props }) => React.createElement(View, { style, ...props }, children);
const ScreenContainer = ({ children, style, ...props }) => React.createElement(View, { style, ...props }, children);
const ScreenStack = ({ children, style, ...props }) => React.createElement(View, { style, ...props }, children);
const ScreenStackHeaderConfig = () => null;
const enableScreens = () => {};
const screensEnabled = () => false;
module.exports = { Screen, ScreenContainer, ScreenStack, ScreenStackHeaderConfig, enableScreens, screensEnabled };
module.exports.default = module.exports;
