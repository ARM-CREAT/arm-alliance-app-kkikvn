// Stub for expo-media-library — no-op on web/preview
const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' };
const MediaType = { photo: 'photo', video: 'video', audio: 'audio', unknown: 'unknown' };
const SortBy = { default: 'default', creationTime: 'creationTime', modificationTime: 'modificationTime', mediaType: 'mediaType', width: 'width', height: 'height', duration: 'duration' };
const requestPermissionsAsync = async () => ({ status: 'denied', granted: false });
const getPermissionsAsync = async () => ({ status: 'denied', granted: false });
const getAssetsAsync = async () => ({ assets: [], endCursor: '', hasNextPage: false, totalCount: 0 });
const createAssetAsync = async (_uri) => null;
const saveToLibraryAsync = async (_uri) => {};
const usePermissions = () => [{ granted: false, status: 'denied' }, async () => ({ granted: false })];
module.exports = { PermissionStatus, MediaType, SortBy, requestPermissionsAsync, getPermissionsAsync, getAssetsAsync, createAssetAsync, saveToLibraryAsync, usePermissions };
module.exports.default = module.exports;
