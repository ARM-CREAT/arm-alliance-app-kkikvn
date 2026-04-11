/* eslint-disable react/prop-types */
const React = require('react');
const { View, Text } = require('react-native');
const MapView = ({ style, children }) =>
  React.createElement(View, {
    style: [{ backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', minHeight: 200 }, style],
  }, React.createElement(Text, { style: { color: '#666', fontSize: 14 } }, 'Carte non disponible'));
MapView.Marker = () => null;
MapView.Polyline = () => null;
MapView.Polygon = () => null;
MapView.Circle = () => null;
MapView.Callout = () => null;
module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = MapView.Marker;
module.exports.Polyline = MapView.Polyline;
module.exports.Polygon = MapView.Polygon;
module.exports.Circle = MapView.Circle;
module.exports.Callout = MapView.Callout;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = null;
