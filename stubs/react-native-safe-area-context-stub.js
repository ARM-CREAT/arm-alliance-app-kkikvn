// Stub for react-native-safe-area-context — no-op on web/preview
/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');
const SafeAreaProvider = ({ children }) => React.createElement(View, { style: { flex: 1 } }, children);
const SafeAreaView = ({ children, style, edges, ...props }) => React.createElement(View, { style, ...props }, children);
const SafeAreaConsumer = ({ children }) => children({ top: 0, right: 0, bottom: 0, left: 0 });
const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 });
const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 390, height: 844 });
const initialWindowMetrics = { insets: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { x: 0, y: 0, width: 390, height: 844 } };
const SafeAreaInsetsContext = React.createContext({ top: 0, right: 0, bottom: 0, left: 0 });
module.exports = { SafeAreaProvider, SafeAreaView, SafeAreaConsumer, useSafeAreaInsets, useSafeAreaFrame, initialWindowMetrics, SafeAreaInsetsContext };
module.exports.default = module.exports;
