
import Constants from 'expo-constants';

// Get backend URL from app.json configuration
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || '';

// Log the backend URL for debugging
console.log('[API] Backend URL configured:', BACKEND_URL);

// Helper function for making API calls with proper error handling
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}:`, errorText);
      return {
        data: null,
        error: `Erreur ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const data = await response.json();
    console.log(`[API] Success:`, data);
    return { data, error: null };
  } catch (error) {
    console.error('[API] Network error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erreur réseau',
    };
  }
}
