import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';

import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';



const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

function TabIndicator({
  activeTabIndex,
  tabWidth,
  tabCount,
  indicatorColor,
}: {
  activeTabIndex: number;
  tabWidth: number;
  tabCount: number;
  indicatorColor: string;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: tabWidth * activeTabIndex,
      useNativeDriver: false,
      damping: 20,
      stiffness: 120,
      mass: 1,
    }).start();
  }, [activeTabIndex, tabWidth, translateX]);

  const tabWidthPct = ((100 / tabCount) - 1).toFixed(2);

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          backgroundColor: indicatorColor,
          width: `${tabWidthPct}%` as any,
          transform: [{ translateX }],
        },
      ]}
    />
  );
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth / 2.5,
  borderRadius = 35,
  bottomMargin,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;
      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      } else if (
        typeof tab.route === 'string' &&
        tab.route.includes('/(tabs)/') &&
        pathname.includes(tab.route.split('/(tabs)/')[1])
      ) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  const handleTabPress = (route: Href) => {
    console.log('[FloatingTabBar] Tab pressed, navigating to:', route);
    router.push(route);
  };

  const tabWidth = (containerWidth - 8) / tabs.length;
  const tabCount = tabs.length;
  const isDark = theme.dark;

  const indicatorColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.04)';

  const blurContainerStyle = {
    ...styles.blurContainer,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 1)' as const,
    ...Platform.select({
      ios: {
        backgroundColor: isDark
          ? 'rgba(28, 28, 30, 0.8)'
          : 'rgba(255, 255, 255, 0.6)',
      },
      android: {
        backgroundColor: isDark
          ? 'rgba(28, 28, 30, 0.95)'
          : 'rgba(255, 255, 255, 0.6)',
      },
      web: {
        backgroundColor: isDark
          ? 'rgba(28, 28, 30, 0.95)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
      },
    }),
  };

  const tabsContent = (
    <>
      <View style={styles.background} />
      <TabIndicator
        activeTabIndex={activeTabIndex}
        tabWidth={tabWidth}
        tabCount={tabCount}
        indicatorColor={indicatorColor}
      />
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => {
          const isActive = activeTabIndex === index;
          const tabKey = `tab-${tab.name}-${index}`;
          const iconColor = isActive
            ? theme.colors.primary
            : isDark
            ? '#98989D'
            : '#000000';
          const labelColor = isActive
            ? theme.colors.primary
            : isDark
            ? '#98989D'
            : '#8E8E93';
          const labelWeight = isActive ? ('600' as const) : ('500' as const);

          return (
            <TouchableOpacity
              key={tabKey}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <IconSymbol
                  android_material_icon_name={tab.icon}
                  ios_icon_name={tab.icon}
                  size={24}
                  color={iconColor}
                />
                <Text style={[styles.tabLabel, { color: labelColor, fontWeight: labelWeight }]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <View style={[styles.safeArea, { paddingBottom: 34 }]}>
      <View
        style={[
          styles.container,
          { width: containerWidth, marginBottom: bottomMargin ?? 20 },
        ]}
      >
        <View style={[blurContainerStyle, { borderRadius }]}>
          {tabsContent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    borderRadius: 27,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
});
