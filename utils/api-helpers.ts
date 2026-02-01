
import Constants from 'expo-constants';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || '';

console.log('[API] Backend URL configured:', BACKEND_URL);

// Re-export from the main api.ts file
export { authenticatedApiCall, apiCall } from './api';
