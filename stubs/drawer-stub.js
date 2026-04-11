// Stub for @react-navigation/drawer — no-op on web/preview
const React = require('react');
const { View } = require('react-native');

const DrawerNavigator = () => null;
const DrawerScreen = () => null;
const DrawerContent = () => null;
const DrawerItem = () => null;
const DrawerToggleButton = () => null;

const createDrawerNavigator = () => ({
  Navigator: DrawerNavigator,
  Screen: DrawerScreen,
  Group: DrawerScreen,
});

const useDrawerStatus = () => 'closed';
const useDrawerProgress = () => ({ value: 0 });
const getDrawerStatusFromState = () => 'closed';

module.exports = {
  default: { createDrawerNavigator },
  createDrawerNavigator,
  DrawerContent,
  DrawerItem,
  DrawerToggleButton,
  useDrawerStatus,
  useDrawerProgress,
  getDrawerStatusFromState,
};
