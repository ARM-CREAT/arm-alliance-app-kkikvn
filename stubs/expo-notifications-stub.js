// Stub for expo-notifications — no-op on web/preview
const AndroidImportance = { DEFAULT: 3, HIGH: 4, LOW: 2, MAX: 5, MIN: 1, NONE: 0, UNSPECIFIED: -1 };
const IosAuthorizationStatus = { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 };
const getPermissionsAsync = async () => ({ status: 'denied', granted: false, ios: { status: 1 } });
const requestPermissionsAsync = async () => ({ status: 'denied', granted: false });
const getExpoPushTokenAsync = async () => ({ data: '' });
const scheduleNotificationAsync = async () => '';
const cancelScheduledNotificationAsync = async () => {};
const cancelAllScheduledNotificationsAsync = async () => {};
const dismissNotificationAsync = async () => {};
const dismissAllNotificationsAsync = async () => {};
const getBadgeCountAsync = async () => 0;
const setBadgeCountAsync = async () => false;
const setNotificationHandler = () => {};
const setNotificationChannelAsync = async () => null;
const addNotificationReceivedListener = (_handler) => ({ remove: () => {} });
const addNotificationResponseReceivedListener = (_handler) => ({ remove: () => {} });
const removeNotificationSubscription = (_sub) => {};
const useLastNotificationResponse = () => null;
module.exports = {
  AndroidImportance, IosAuthorizationStatus,
  getPermissionsAsync, requestPermissionsAsync, getExpoPushTokenAsync,
  scheduleNotificationAsync, cancelScheduledNotificationAsync, cancelAllScheduledNotificationsAsync,
  dismissNotificationAsync, dismissAllNotificationsAsync,
  getBadgeCountAsync, setBadgeCountAsync, setNotificationHandler, setNotificationChannelAsync,
  addNotificationReceivedListener, addNotificationResponseReceivedListener,
  removeNotificationSubscription, useLastNotificationResponse,
};
module.exports.default = module.exports;
