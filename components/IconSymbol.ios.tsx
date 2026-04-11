import React from "react";
import { StyleProp, ViewStyle, OpaqueColorValue, StyleSheet, TextStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// expo-symbols requires a native dev build — always use MaterialIcons fallback.
const SymbolView: any = null;

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

// Map common MaterialIcons / generic names to valid SF Symbol names
const ICON_MAP: Record<string, string> = {
  home: "house.fill",
  person: "person.fill",
  settings: "gearshape.fill",
  search: "magnifyingglass",
  add: "plus",
  close: "xmark",
  back: "chevron.left",
  forward: "chevron.right",
  check: "checkmark",
  info: "info.circle.fill",
  warning: "exclamationmark.triangle.fill",
  error: "xmark.circle.fill",
  star: "star.fill",
  heart: "heart.fill",
  share: "square.and.arrow.up",
  edit: "pencil",
  delete: "trash.fill",
  camera: "camera.fill",
  image: "photo.fill",
  mail: "envelope.fill",
  phone: "phone.fill",
  location: "location.fill",
  calendar: "calendar",
  clock: "clock.fill",
  lock: "lock.fill",
  unlock: "lock.open.fill",
  notification: "bell.fill",
  notifications: "bell.fill",
  menu: "line.3.horizontal",
  more: "ellipsis",
  download: "arrow.down.circle.fill",
  upload: "arrow.up.circle.fill",
  refresh: "arrow.clockwise",
  filter: "line.3.horizontal.decrease.circle",
  sort: "arrow.up.arrow.down",
  list: "list.bullet",
  grid: "square.grid.2x2.fill",
  map: "map.fill",
  chart: "chart.bar.fill",
  money: "dollarsign.circle.fill",
  document: "doc.fill",
  folder: "folder.fill",
  link: "link",
  play: "play.fill",
  pause: "pause.fill",
  stop: "stop.fill",
  volume: "speaker.wave.2.fill",
  wifi: "wifi",
  bluetooth: "bluetooth",
  battery: "battery.100",
  brightness: "sun.max.fill",
  dark_mode: "moon.fill",
  accessibility: "accessibility",
  language: "globe",
  security: "shield.fill",
  help: "questionmark.circle.fill",
  logout: "rectangle.portrait.and.arrow.right",
  login: "person.badge.plus",
  profile: "person.circle.fill",
  group: "person.2.fill",
  message: "message.fill",
  chat: "bubble.left.fill",
  video: "video.fill",
  mic: "mic.fill",
  speaker: "speaker.fill",
  headphones: "headphones",
  music: "music.note",
  book: "book.fill",
  bookmark: "bookmark.fill",
  tag: "tag.fill",
  flag: "flag.fill",
  pin: "pin.fill",
  attachment: "paperclip",
  copy: "doc.on.doc.fill",
  paste: "doc.on.clipboard.fill",
  cut: "scissors",
  undo: "arrow.uturn.backward",
  redo: "arrow.uturn.forward",
  zoom_in: "plus.magnifyingglass",
  zoom_out: "minus.magnifyingglass",
  fullscreen: "arrow.up.left.and.arrow.down.right",
  minimize: "arrow.down.right.and.arrow.up.left",
  expand: "chevron.down",
  collapse: "chevron.up",
  arrow_up: "arrow.up",
  arrow_down: "arrow.down",
  arrow_left: "arrow.left",
  arrow_right: "arrow.right",
};

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
