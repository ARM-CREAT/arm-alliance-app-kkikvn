// Stub for react-native-svg — no-op on web/preview
/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');
const noop = () => null;
const Svg = ({ children, style, width, height }) =>
  React.createElement(View, { style: [{ width, height }, style] }, children);
const G = ({ children }) => React.createElement(React.Fragment, null, children);
const Path = noop;
const Circle = noop;
const Rect = noop;
const Line = noop;
const Polyline = noop;
const Polygon = noop;
const Ellipse = noop;
const Text = noop;
const TSpan = noop;
const TextPath = noop;
const Use = noop;
const Image = noop;
const Symbol = noop;
const Defs = noop;
const LinearGradient = noop;
const RadialGradient = noop;
const Stop = noop;
const ClipPath = noop;
const Pattern = noop;
const Mask = noop;
const ForeignObject = noop;
const Marker = noop;
module.exports = {
  default: Svg, Svg, G, Path, Circle, Rect, Line, Polyline, Polygon, Ellipse,
  Text, TSpan, TextPath, Use, Image, Symbol, Defs, LinearGradient, RadialGradient,
  Stop, ClipPath, Pattern, Mask, ForeignObject, Marker,
};
