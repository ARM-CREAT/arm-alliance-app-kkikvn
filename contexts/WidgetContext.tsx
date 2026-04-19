import React, { createContext, useCallback, useContext } from 'react';
import { Platform } from 'react-native';

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType>({
  refreshWidget: () => {},
});

function tryReloadWidget() {
  if (Platform.OS !== 'ios') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appleTargets = require('@bacons/apple-targets');
    if (appleTargets && appleTargets.ExtensionStorage) {
      appleTargets.ExtensionStorage.reloadWidget();
    }
  } catch {
    // Not available in Expo Go — silently ignore
  }
}

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const refreshWidget = useCallback(() => {
    tryReloadWidget();
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => useContext(WidgetContext);

export default WidgetContext;
