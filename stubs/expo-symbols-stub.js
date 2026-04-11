// Stub for expo-symbols
const React = require('react');
const { View, Text } = require('react-native');

const SymbolView = ({ name, size, color, style, weight, scale, resizeMode, animationSpec, fallback, ...props }) =>
  React.createElement(View, { style: [{ width: size || 24, height: size || 24 }, style], ...props },
    React.createElement(Text, { style: { fontSize: (size || 24) * 0.7, color: color || '#000' } }, '◆')
  );

const SFSymbol = SymbolView;

module.exports = {
  default: SymbolView,
  SymbolView,
  SFSymbol,
  SymbolWeight: { ultraLight: 'ultraLight', thin: 'thin', light: 'light', regular: 'regular', medium: 'medium', semibold: 'semibold', bold: 'bold', heavy: 'heavy', black: 'black' },
  SymbolScale: { default: 'default', small: 'small', medium: 'medium', large: 'large' },
  SymbolResizeMode: { stretch: 'stretch', aspectFit: 'aspectFit', aspectFill: 'aspectFill' },
};
