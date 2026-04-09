import { registerSW } from 'virtual:pwa-register';

export type ServiceWorkerUpdate = ReturnType<typeof registerSW>;

export function registerTheLedgerServiceWorker(options?: Parameters<typeof registerSW>[0]): ServiceWorkerUpdate | null {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    return registerSW({
      immediate: true,
      ...options
    });
  }

  return null;
}

type PreloadErrorEvent = Event & {
  preventDefault?: () => void;
};

interface ResetAppShellOptions {
  cacheStorage?: Pick<CacheStorage, 'delete' | 'keys'>;
  location?: Pick<Location, 'reload'>;
  serviceWorkerContainer?: Pick<ServiceWorkerContainer, 'getRegistrations'>;
}

export function createVitePreloadRecovery(reload: () => void) {
  return (event: PreloadErrorEvent) => {
    event.preventDefault?.();
    reload();
  };
}

export function installVitePreloadRecovery(reload: () => void = () => window.location.reload()) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = createVitePreloadRecovery(reload);
  window.addEventListener('vite:preloadError', handler as EventListener);

  return () => {
    window.removeEventListener('vite:preloadError', handler as EventListener);
  };
}

export async function resetTheLedgerAppShell(options: ResetAppShellOptions = {}) {
  const serviceWorkerContainer =
    options.serviceWorkerContainer ?? (typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined);

  if (serviceWorkerContainer) {
    const registrations = await serviceWorkerContainer.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  const cacheStorage = options.cacheStorage ?? (typeof window !== 'undefined' ? window.caches : undefined);

  if (cacheStorage) {
    const cacheNames = await cacheStorage.keys();
    await Promise.all(cacheNames.map((cacheName) => cacheStorage.delete(cacheName)));
  }

  const location = options.location ?? (typeof window !== 'undefined' ? window.location : undefined);
  location?.reload();
}
