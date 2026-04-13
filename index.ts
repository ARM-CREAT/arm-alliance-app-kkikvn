import 'expo-router/entry';

// Deferred — must run after the router entry to avoid module init ordering issues
import('./utils/errorLogger').catch(() => {});
