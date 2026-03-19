
import Constants from 'expo-constants';

// Production URL hardcoded as fallback — ensures it is never empty in
// production APK/AAB builds where Constants.expoConfig may not resolve.
const PRODUCTION_BACKEND_URL = 'https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev';
export const BACKEND_URL: string =
  Constants.expoConfig?.extra?.backendUrl ||
  PRODUCTION_BACKEND_URL;

console.log('[API] Backend URL configured:', BACKEND_URL);

// Re-export from the main api.ts file
export { authenticatedApiCall, apiCall } from './api';
