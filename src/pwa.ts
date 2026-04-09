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
