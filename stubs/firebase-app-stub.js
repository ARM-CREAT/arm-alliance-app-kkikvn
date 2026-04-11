const app = { name: '[DEFAULT]', options: {}, automaticDataCollectionEnabled: false };
const firebaseApp = {
  apps: [app],
  app: () => app,
  getApp: () => app,
  getApps: () => [app],
  initializeApp: () => app,
  registerVersion: () => {},
  setLogLevel: () => {},
  SDK_VERSION: '0.0.0',
};
module.exports = firebaseApp;
module.exports.default = firebaseApp;
module.exports.apps = [app];
module.exports.app = () => app;
module.exports.getApp = () => app;
module.exports.getApps = () => [app];
module.exports.initializeApp = () => app;
module.exports.registerVersion = () => {};
module.exports.setLogLevel = () => {};
