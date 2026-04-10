import React from "react";
import { StyleProp, ViewStyle, OpaqueColorValue, StyleSheet, TextStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// expo-symbols requires a native build (not available in Expo Go).
// We try to load it at runtime and fall back to MaterialIcons if unavailable.
let SymbolView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoSymbols = require("expo-symbols");
  SymbolView = expoSymbols.SymbolView;
} catch {
  SymbolView = null;
}

// Map arbitrary weight strings to valid SymbolWeight values
const VALID_WEIGHTS = [
  "ultraLight", "thin", "light", "regular", "medium",
  "semibold", "bold", "heavy", "black",
];

function toSymbolWeight(w?: string): string {
  if (w && VALID_WEIGHTS.includes(w)) {
    return w;
  }
  return "regular";
}

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
  weight,
  onPress,
  onClick,
  onMouseOver,
  onMouseLeave,
  testID,
  accessibilityLabel,
}: {
  ios_icon_name?: string;
  android_material_icon_name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: string;
  onPress?: any;
  onClick?: any;
  onMouseOver?: any;
  onMouseLeave?: any;
  testID?: any;
  accessibilityLabel?: any;
}) {
  // If expo-symbols is available and we have an iOS icon name, use SymbolView
  if (SymbolView && ios_icon_name) {
    const resolvedWeight = toSymbolWeight(weight);
    return (
      <SymbolView
        onPress={onPress}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        weight={resolvedWeight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={ios_icon_name}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  // Fallback: MaterialIcons (works in Expo Go and all environments)
  return (
    <MaterialIcons
      onPress={onPress}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      color={color as string}
      size={size}
      name={android_material_icon_name}
      style={style as StyleProp<TextStyle>}
    />
  );
}
