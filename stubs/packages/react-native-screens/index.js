/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');
const Screen = ({ children, style }) => React.createElement(View, { style }, children);
const ScreenContainer = ({ children, style }) => React.createElement(View, { style }, children);
const ScreenStack = ({ children, style }) => React.createElement(View, { style }, children);
const ScreenStackHeaderConfig = () => null;
const enableScreens = () => {};
module.exports = { Screen, ScreenContainer, ScreenStack, ScreenStackHeaderConfig, enableScreens };
