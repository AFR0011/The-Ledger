import { registerSW } from 'virtual:pwa-register';

export function registerTheLedgerServiceWorker() {
  if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
  }
}

