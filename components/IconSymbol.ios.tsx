import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

// Map arbitrary weight strings to valid SymbolWeight values
const VALID_WEIGHTS: SymbolWeight[] = [
  "ultraLight", "thin", "light", "regular", "medium",
  "semibold", "bold", "heavy", "black",
];

function toSymbolWeight(w?: string): SymbolWeight {
  if (w && (VALID_WEIGHTS as string[]).includes(w)) {
    return w as SymbolWeight;
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
  ios_icon_name: SymbolViewProps["name"];
  android_material_icon_name: any;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: string;
  onPress?: any;
  onClick?: any;
  onMouseOver?: any;
  onMouseLeave?: any;
  testID?: any;
  accessibilityLabel?: any;
}) {
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
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
