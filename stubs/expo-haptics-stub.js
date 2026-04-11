// Stub for expo-haptics — no-op on web/preview
const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' };
const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
const ImpactAsync = async (_style) => {};
const NotificationAsync = async (_type) => {};
const SelectionAsync = async () => {};
module.exports = { ImpactFeedbackStyle, NotificationFeedbackType, impactAsync: ImpactAsync, notificationAsync: NotificationAsync, selectionAsync: SelectionAsync };
module.exports.default = module.exports;
