import * as React from 'react';
import { createContext, useCallback, useContext } from 'react';
import { Platform } from 'react-native';

function getAppleTargets() {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@bacons/apple-targets');
  } catch {
    return null;
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType>({
  refreshWidget: () => {},
});

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    try {
      const appleTargets = getAppleTargets();
      if (appleTargets) appleTargets.ExtensionStorage.reloadWidget();
    } catch {
      // Not available in this environment
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS !== 'ios') return;
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
