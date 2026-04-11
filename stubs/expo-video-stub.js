// Stub for expo-video — no-op on web/preview
/* eslint-disable react/prop-types */
const React = require('react');
const { View, Text } = require('react-native');
const VideoView = ({ style }) =>
  React.createElement(View, { style: [{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', minHeight: 200 }, style] },
    React.createElement(Text, { style: { color: '#fff', fontSize: 14 } }, 'Vidéo non disponible')
  );
const useVideoPlayer = (_source, _setup) => ({
  play: () => {}, pause: () => {}, replace: () => {}, seekBy: () => {}, generateThumbnailsAsync: async () => [],
  currentTime: 0, duration: 0, playing: false, muted: false, volume: 1, loop: false, playbackRate: 1,
  status: 'idle', error: null,
  addListener: () => ({ remove: () => {} }),
  removeAllListeners: () => {},
});
module.exports = { VideoView, useVideoPlayer };
module.exports.default = VideoView;
