// Stub for expo-blur
/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');

const BlurView = ({ children, style, intensity, tint, experimentalBlurMethod, blurReductionFactor, ...props }) =>
  React.createElement(View, { style, ...props }, children);

const ExpoBlurView = BlurView;

module.exports = {
  default: BlurView,
  BlurView,
  ExpoBlurView,
};
