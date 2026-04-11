// Stub for react-native-edge-to-edge
const noop = () => {};

const EdgeToEdge = {
  enable: noop,
  disable: noop,
};

module.exports = {
  default: EdgeToEdge,
  ...EdgeToEdge,
  SystemBars: { setStyle: noop, pushStackEntry: noop, popStackEntry: noop, replaceStackEntry: noop },
  navigationBarColor: null,
  statusBarColor: null,
};
