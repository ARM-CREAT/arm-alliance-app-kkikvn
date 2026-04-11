const { useRef, useEffect } = require('react');

const useSharedValue = (val) => {
  const ref = useRef({ value: val });
  return ref.current;
};

const useAnimatedStyle = (fn) => {
  try { return fn(); } catch { return {}; }
};

const useAnimatedScrollHandler = () => () => {};
const useAnimatedGestureHandler = () => () => {};
const useAnimatedRef = () => ({ current: null });
const useAnimatedReaction = () => {};
const useDerivedValue = (fn) => {
  const ref = useRef({ value: undefined });
  try { ref.current.value = fn(); } catch {}
  return ref.current;
};

const withTiming = (val) => val;
const withSpring = (val) => val;
const withDecay = (val) => val;
const withDelay = (_delay, val) => val;
const withRepeat = (val) => val;
const withSequence = (...vals) => vals[vals.length - 1];
const cancelAnimation = () => {};
const interpolate = (val, input, output) => {
  if (!input || !output || input.length < 2) return output ? output[0] : val;
  const idx = input.findIndex((v) => val <= v);
  if (idx <= 0) return output[0];
  if (idx >= input.length) return output[output.length - 1];
  const t = (val - input[idx - 1]) / (input[idx] - input[idx - 1]);
  return output[idx - 1] + t * (output[idx] - output[idx - 1]);
};
const interpolateColor = (_val, _input, output) => output ? output[0] : '#000000';
const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
const Extrapolate = Extrapolation;

const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const useWorkletCallback = (fn) => fn;
const makeMutable = (val) => ({ value: val });
const makeShareable = (val) => val;

const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  poly: () => (t) => t,
  sin: (t) => t,
  circle: (t) => t,
  exp: (t) => t,
  elastic: () => (t) => t,
  back: () => (t) => t,
  bounce: (t) => t,
  bezier: () => (t) => t,
  bezierFn: () => (t) => t,
  in: (fn) => fn,
  out: (fn) => fn,
  inOut: (fn) => fn,
};

const FadeIn = { duration: () => FadeIn, delay: () => FadeIn, easing: () => FadeIn, springify: () => FadeIn };
const FadeOut = { duration: () => FadeOut, delay: () => FadeOut, easing: () => FadeOut, springify: () => FadeOut };
const SlideInRight = { duration: () => SlideInRight, delay: () => SlideInRight };
const SlideOutLeft = { duration: () => SlideOutLeft, delay: () => SlideOutLeft };
const ZoomIn = { duration: () => ZoomIn, delay: () => ZoomIn };
const ZoomOut = { duration: () => ZoomOut, delay: () => ZoomOut };
const Layout = { duration: () => Layout, delay: () => Layout, easing: () => Layout, springify: () => Layout };
const LinearTransition = Layout;
const CurvedTransition = Layout;
const EntryExitTransition = Layout;
const SequencedTransition = Layout;
const JumpingTransition = Layout;
const BounceIn = FadeIn;
const BounceOut = FadeOut;
const FlipInEasyX = FadeIn;
const FlipOutEasyX = FadeOut;
const LightSpeedInRight = FadeIn;
const LightSpeedOutRight = FadeOut;
const PinwheelIn = FadeIn;
const PinwheelOut = FadeOut;
const RotateInDownLeft = FadeIn;
const RotateOutDownLeft = FadeOut;
const RollInLeft = FadeIn;
const RollOutLeft = FadeOut;
const StretchInX = FadeIn;
const StretchOutX = FadeOut;

const { View, Text, Image, ScrollView, FlatList } = require('react-native');
const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent: (C) => C,
  event: () => () => {},
  add: (a, b) => (a || 0) + (b || 0),
  subtract: (a, b) => (a || 0) - (b || 0),
  multiply: (a, b) => (a || 0) * (b || 0),
  divide: (a, b) => (a || 1) / (b || 1),
  modulo: (a, b) => (a || 0) % (b || 1),
  diffClamp: (val) => val,
  delay: (_t, val) => val,
  sequence: (...vals) => vals[vals.length - 1],
  parallel: (anims) => anims[0],
  stagger: (_t, anims) => anims[0],
  loop: (anim) => anim,
  spring: () => ({ start: () => {}, stop: () => {}, reset: () => {} }),
  timing: () => ({ start: () => {}, stop: () => {}, reset: () => {} }),
  decay: () => ({ start: () => {}, stop: () => {}, reset: () => {} }),
};

const useAnimatedProps = (fn) => {
  try { return fn(); } catch { return {}; }
};

const useScrollViewOffset = () => ({ value: 0 });
const useAnimatedKeyboard = () => ({ height: { value: 0 }, state: { value: 0 } });
const useAnimatedSensor = () => ({ sensor: { value: {} }, unregister: () => {} });
const useReducedMotion = () => false;
const useFrameCallback = () => {};
const useAnimatedValue = (val) => ({ value: val });

module.exports = {
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedReaction,
  useDerivedValue,
  useAnimatedProps,
  useScrollViewOffset,
  useAnimatedKeyboard,
  useAnimatedSensor,
  useReducedMotion,
  useFrameCallback,
  useAnimatedValue,
  useWorkletCallback,
  withTiming,
  withSpring,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  interpolate,
  interpolateColor,
  Extrapolation,
  Extrapolate,
  Easing,
  runOnJS,
  runOnUI,
  makeMutable,
  makeShareable,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  Layout,
  LinearTransition,
  CurvedTransition,
  EntryExitTransition,
  SequencedTransition,
  JumpingTransition,
  BounceIn,
  BounceOut,
  FlipInEasyX,
  FlipOutEasyX,
  LightSpeedInRight,
  LightSpeedOutRight,
  PinwheelIn,
  PinwheelOut,
  RotateInDownLeft,
  RotateOutDownLeft,
  RollInLeft,
  RollOutLeft,
  StretchInX,
  StretchOutX,
  createAnimatedComponent: (C) => C,
};
