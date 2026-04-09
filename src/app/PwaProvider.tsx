import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { registerTheLedgerServiceWorker, resetTheLedgerAppShell, type ServiceWorkerUpdate } from '../pwa';
import { PwaContext, type PwaContextValue } from './PwaContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

function detectStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => detectStandaloneMode());
  const updateServiceWorkerRef = useRef<ServiceWorkerUpdate | null>(null);
  const reloadedForControllerChangeRef = useRef(false);

  useEffect(() => {
    const updateServiceWorker = registerTheLedgerServiceWorker({
      onOfflineReady() {
        setOfflineReady(true);
      },
      onNeedRefresh() {
        setUpdateAvailable(true);
      }
    });

    updateServiceWorkerRef.current = updateServiceWorker;

    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setOfflineReady(false);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setIsInstalled(event.matches);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    const handleControllerChange = () => {
      if (reloadedForControllerChangeRef.current) {
        return;
      }

      reloadedForControllerChangeRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const applyUpdate = useCallback(async () => {
    if (updateServiceWorkerRef.current) {
      await updateServiceWorkerRef.current(true);
    }
  }, []);

  const resetAppShell = useCallback(async () => {
    await resetTheLedgerAppShell();
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: deferredPrompt !== null && !isInstalled,
      isInstalled,
      offlineReady,
      updateAvailable,
      installApp,
      applyUpdate,
      resetAppShell,
      dismissOfflineReady: () => setOfflineReady(false),
      dismissUpdate: () => setUpdateAvailable(false)
    }),
    [applyUpdate, deferredPrompt, installApp, isInstalled, offlineReady, resetAppShell, updateAvailable]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
