import { createContext } from 'react';

export interface PwaContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  offlineReady: boolean;
  updateAvailable: boolean;
  installApp: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissOfflineReady: () => void;
  dismissUpdate: () => void;
}

export const PwaContext = createContext<PwaContextValue | null>(null);
