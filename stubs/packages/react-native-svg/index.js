/* eslint-disable react/prop-types */
const React = require('react');
const { View } = require('react-native');
const Svg = ({ children, width, height, style }) => React.createElement(View, { style: [{ width, height }, style] }, children);
const Path = () => null;
const Circle = () => null;
const Rect = () => null;
const G = ({ children }) => React.createElement(React.Fragment, null, children);
const Text = () => null;
const Defs = () => null;
const LinearGradient = () => null;
const Stop = () => null;
const ClipPath = () => null;
const Ellipse = () => null;
const Line = () => null;
const Polygon = () => null;
const Polyline = () => null;
const Use = () => null;
module.exports = { default: Svg, Svg, Path, Circle, Rect, G, Text, Defs, LinearGradient, Stop, ClipPath, Ellipse, Line, Polygon, Polyline, Use };
