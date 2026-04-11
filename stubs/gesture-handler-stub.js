// Stub for react-native-gesture-handler
const React = require('react');
const { View } = require('react-native');

const GestureHandlerRootView = ({ children, style, ...props }) =>
  React.createElement(View, { style, ...props }, children);

const noop = () => {};
const noopClass = class {};

const Gesture = {
  Tap: () => ({ onBegin: () => Gesture.Tap(), onStart: () => Gesture.Tap(), onEnd: () => Gesture.Tap(), onFinalize: () => Gesture.Tap(), maxDuration: () => Gesture.Tap(), numberOfTaps: () => Gesture.Tap(), enabled: () => Gesture.Tap() }),
  Pan: () => ({ onBegin: () => Gesture.Pan(), onStart: () => Gesture.Pan(), onUpdate: () => Gesture.Pan(), onEnd: () => Gesture.Pan(), onFinalize: () => Gesture.Pan(), enabled: () => Gesture.Pan(), minDistance: () => Gesture.Pan(), activeOffsetX: () => Gesture.Pan(), activeOffsetY: () => Gesture.Pan() }),
  Pinch: () => ({ onStart: () => Gesture.Pinch(), onUpdate: () => Gesture.Pinch(), onEnd: () => Gesture.Pinch(), enabled: () => Gesture.Pinch() }),
  Rotation: () => ({ onStart: () => Gesture.Rotation(), onUpdate: () => Gesture.Rotation(), onEnd: () => Gesture.Rotation(), enabled: () => Gesture.Rotation() }),
  Simultaneous: (...gestures) => ({ gestures }),
  Exclusive: (...gestures) => ({ gestures }),
  Race: (...gestures) => ({ gestures }),
};

const GestureDetector = ({ children }) => children || null;

const ScrollView = View;
const FlatList = View;
const Switch = View;
const TextInput = View;
const DrawerLayout = View;
const TouchableHighlight = ({ children, ...props }) => React.createElement(View, props, children);
const TouchableNativeFeedback = ({ children, ...props }) => React.createElement(View, props, children);
const TouchableOpacity = ({ children, ...props }) => React.createElement(View, props, children);
const TouchableWithoutFeedback = ({ children, ...props }) => React.createElement(View, props, children);
const RawButton = ({ children, ...props }) => React.createElement(View, props, children);
const BaseButton = ({ children, ...props }) => React.createElement(View, props, children);
const RectButton = ({ children, ...props }) => React.createElement(View, props, children);
const BorderlessButton = ({ children, ...props }) => React.createElement(View, props, children);

const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 };
const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 };

module.exports = {
  default: { GestureHandlerRootView },
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  ScrollView,
  FlatList,
  Switch,
  TextInput,
  DrawerLayout,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RawButton,
  BaseButton,
  RectButton,
  BorderlessButton,
  State,
  Directions,
  gestureHandlerRootHOC: (Component) => Component,
  createNativeWrapper: (Component) => Component,
  enableExperimentalWebImplementation: noop,
  enableLegacyWebImplementation: noop,
  TapGestureHandler: noopClass,
  PanGestureHandler: noopClass,
  PinchGestureHandler: noopClass,
  RotationGestureHandler: noopClass,
  FlingGestureHandler: noopClass,
  LongPressGestureHandler: noopClass,
  NativeViewGestureHandler: noopClass,
  ForceTouchGestureHandler: noopClass,
};
