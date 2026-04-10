import React from "react";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, useColorScheme, View, Text, Platform, Animated as RNAnimated } from "react-native";
import { appleRed, borderColor } from "@/constants/Colors";
import { IconSymbol } from "./IconSymbol";

// react-native-reanimated and gesture-handler are native-only — guard against web crash
let Animated: any = { View: RNAnimated.View };
let FadeIn: any = undefined;
let useAnimatedStyle: any = () => ({});
let ReanimatedSwipeable: any = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require("react-native-reanimated");
    Animated = Reanimated.default ?? Reanimated;
    FadeIn = Reanimated.FadeIn;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
  } catch { /* ignore */ }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ReanimatedSwipeable = require("react-native-gesture-handler/ReanimatedSwipeable").default;
  } catch { /* ignore */ }
}

function RightAction({ drag, listId }: { drag: any; listId: string }) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: (drag?.value ?? 0) + 200 }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        console.log("[ListItem] Delete pressed for:", listId);
      }}
    >
      <Animated.View style={[styleAnimation, styles.rightAction]}>
        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={24} color="white" />
      </Animated.View>
    </Pressable>
  );
}

export default function ListItem({ listId }: { listId: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // On web, render a simple non-swipeable list item
  if (Platform.OS === "web" || !ReanimatedSwipeable) {
    return (
      <View style={styles.listItemContainer}>
        <Text style={[styles.listItemText, { color: isDark ? "#FFFFFF" : "#000000" }]}>{listId}</Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn}>
      <ReanimatedSwipeable
        key={listId}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={(_prog: any, drag: any) => <RightAction drag={drag} listId={listId} />}
        overshootRight={false}
        enableContextMenu
      >
        <View style={styles.listItemContainer}>
          <Text style={[styles.listItemText, { color: isDark ? "#FFFFFF" : "#000000" }]}>{listId}</Text>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

export const NicknameCircle = ({
  nickname,
  color,
  index = 0,
  isEllipsis = false,
}: {
  nickname: string;
  color: string;
  index?: number;
  isEllipsis?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Text
      style={[
        styles.nicknameCircle,
        isEllipsis && styles.ellipsisCircle,
        {
          backgroundColor: color,
          borderColor: isDark ? "#000000" : "#ffffff",
          marginLeft: index > 0 ? -6 : 0,
        },
      ]}
    >
      {isEllipsis ? "..." : nickname[0].toUpperCase()}
    </Text>
  );
};

const styles = StyleSheet.create({
  listItemContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
    backgroundColor: "transparent",
  },
  listItemText: {
    fontSize: 16,
  },
  rightAction: {
    width: 200,
    height: 65,
    backgroundColor: appleRed,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeable: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  textContent: {
    flexShrink: 1,
  },
  productCount: {
    fontSize: 12,
    color: "gray",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nicknameContainer: {
    flexDirection: "row",
    marginRight: 4,
  },
  nicknameCircle: {
    fontSize: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 16,
    padding: 1,
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  ellipsisCircle: {
    lineHeight: 0,
    marginLeft: -6,
  },
});
