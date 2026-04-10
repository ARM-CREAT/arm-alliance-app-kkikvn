module.exports = {
  default: {},
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  useSharedValue: (val) => ({ value: val }),
  useWorkletCallback: (fn) => fn,
};
