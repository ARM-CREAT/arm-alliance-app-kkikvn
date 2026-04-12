import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

// @bacons/apple-targets is iOS-native only. Lazy-require inside a try/catch
// so any module-resolution failure is silently swallowed on all platforms.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appleTargets: any = (() => {
  if (Platform.OS !== "ios") return null;
  try { return require("@bacons/apple-targets"); } catch { return null; }
})();

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Widget refresh is only supported on iOS native builds
    if (Platform.OS !== "ios" || !appleTargets) return;
    try {
      appleTargets.ExtensionStorage.reloadWidget();
    } catch {
      // Not available in this environment
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS !== "ios" || !appleTargets) return;
    try {
      appleTargets.ExtensionStorage.reloadWidget();
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
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
