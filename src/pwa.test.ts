import { describe, expect, it, vi } from 'vitest';

vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn()
}));

import { createVitePreloadRecovery, resetTheLedgerAppShell } from './pwa';

describe('createVitePreloadRecovery', () => {
  it('prevents the default preload failure flow and reloads the page', () => {
    const reload = vi.fn();
    const preventDefault = vi.fn();
    const recover = createVitePreloadRecovery(reload);

    recover({ preventDefault } as unknown as Event & { preventDefault: () => void });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('resetTheLedgerAppShell', () => {
  it('unregisters service workers, clears caches, and reloads', async () => {
    const unregisterA = vi.fn().mockResolvedValue(true);
    const unregisterB = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister: unregisterA }, { unregister: unregisterB }]);
    const cacheKeys = vi.fn().mockResolvedValue(['workbox-precache-a', 'workbox-precache-b']);
    const deleteCache = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    await resetTheLedgerAppShell({
      serviceWorkerContainer: { getRegistrations },
      cacheStorage: { keys: cacheKeys, delete: deleteCache },
      location: { reload }
    });

    expect(getRegistrations).toHaveBeenCalledTimes(1);
    expect(unregisterA).toHaveBeenCalledTimes(1);
    expect(unregisterB).toHaveBeenCalledTimes(1);
    expect(cacheKeys).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenCalledWith('workbox-precache-a');
    expect(deleteCache).toHaveBeenCalledWith('workbox-precache-b');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
