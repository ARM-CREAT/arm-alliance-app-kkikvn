// Safe no-op stub — error logging disabled to prevent startup hangs.
// The previous implementation made fetch calls and overrode console methods
// at module-eval time, which could block the web preview from loading.

export const setupErrorLogging = () => {};
