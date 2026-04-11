/* eslint-disable react/prop-types */
const React = require('react');
const { View, StatusBar } = require('react-native');
const SafeAreaView = ({ children, style, ...props }) =>
  React.createElement(View, { style: [{ paddingTop: StatusBar.currentHeight || 0 }, style], ...props }, children);
const SafeAreaProvider = ({ children }) => React.createElement(React.Fragment, null, children);
const useSafeAreaInsets = () => ({ top: StatusBar.currentHeight || 0, bottom: 34, left: 0, right: 0 });
const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 390, height: 844 });
const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 34, left: 0, right: 0 });
const initialWindowMetrics = { insets: { top: 0, bottom: 34, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 390, height: 844 } };
module.exports = { SafeAreaView, SafeAreaProvider, useSafeAreaInsets, useSafeAreaFrame, SafeAreaInsetsContext, initialWindowMetrics };
