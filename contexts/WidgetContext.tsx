import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

// @bacons/apple-targets is iOS-native only. Lazy-require inside a try/catch
// so any module-resolution failure is silently swallowed on all platforms.
// IMPORTANT: Do NOT call require() at module evaluation time — it runs before
// React mounts and can crash the bundler on web. Defer to call time instead.
function getAppleTargets() {
  if (Platform.OS !== "ios") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@bacons/apple-targets");
  } catch {
    return null;
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

// Safe default so useWidget never throws when called outside the provider
// (e.g. during web SSR hydration before the tree mounts).
const WidgetContext = createContext<WidgetContextType>({
  refreshWidget: () => {},
});

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Widget refresh is only supported on iOS native builds
    if (Platform.OS !== "ios") return;
    try {
      const appleTargets = getAppleTargets();
      if (appleTargets) appleTargets.ExtensionStorage.reloadWidget();
    } catch {
      // Not available in this environment (Expo Go, simulator, etc.)
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS !== "ios") return;
    try {
      const appleTargets = getAppleTargets();
      if (appleTargets) appleTargets.ExtensionStorage.reloadWidget();
    } catch {
      // Not available in this environment
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  return useContext(WidgetContext);
};
