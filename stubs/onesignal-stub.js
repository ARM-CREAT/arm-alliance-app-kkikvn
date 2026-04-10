const OneSignal = {
  initialize: () => {},
  login: () => {},
  logout: () => {},
  User: {
    pushSubscription: { optIn: () => {}, optOut: () => {}, getIdAsync: () => Promise.resolve(null) },
    addTag: () => {},
    removeTag: () => {},
  },
  Notifications: {
    requestPermission: () => Promise.resolve(false),
    getPermissionAsync: () => Promise.resolve(false),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  InAppMessages: { addTrigger: () => {}, removeTrigger: () => {} },
};
module.exports = { OneSignal, default: OneSignal };
