import type { LedgerData, StorageStatus } from '../types/ledger';
import { createDefaultLedgerData, normalizeLedgerData } from './ledgerRepository';

export const STORAGE_KEY = 'the-ledger:v2';
const LEGACY_STORAGE_KEYS = ['the-ledger:v1', 'private-ledger:v1'];

function ready(message: string): StorageStatus {
  return {
    state: 'ready',
    message
  };
}

function checkStorageQuota(): Promise<{ hasQuota: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.navigator?.storage?.estimate) {
    // Storage API not available, assume we have quota
    return Promise.resolve({ hasQuota: true });
  }

  return window.navigator.storage
    .estimate()
    .then((estimate) => {
      // Warn if we're within 10% of the quota
      const usageRatio = (estimate.usage ?? 0) / (estimate.quota ?? 1);
      if (usageRatio > 0.9) {
        return {
          hasQuota: false,
          error: `Storage nearly full: ${(usageRatio * 100).toFixed(0)}% used. Export a backup soon.`
        };
      }
      return { hasQuota: true };
    })
    .catch(() => {
      // If quota checking fails, assume we're fine
      return { hasQuota: true };
    });
}

function testStorageWrite(): { success: boolean; error?: string } {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Storage unavailable outside browser' };
    }
    // Try writing a small test entry
    const testKey = '__storage_test__';
    const testValue = 'test';
    window.localStorage.setItem(testKey, testValue);
    window.localStorage.removeItem(testKey);
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Local storage is blocked or unavailable. Changes will not persist.'
    };
  }
}

function clearStorageKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Best-effort cleanup only.
  }
}

export function loadLedgerData(): { data: LedgerData; status: StorageStatus } {
  if (typeof window === 'undefined') {
    return {
      data: createDefaultLedgerData(),
      status: {
        state: 'unavailable',
        message: 'Storage is unavailable outside the browser, so the app is running in memory only.'
      }
    };
  }

  try {
    const currentValue = window.localStorage.getItem(STORAGE_KEY);
    if (currentValue) {
      try {
        return {
          data: normalizeLedgerData(JSON.parse(currentValue)),
          status: ready('The Ledger is using your local browser storage.')
        };
      } catch {
        clearStorageKey(STORAGE_KEY);
        return {
          data: createDefaultLedgerData(),
          status: {
            state: 'corrupted',
            message: 'Stored data could not be read. The invalid local snapshot was cleared and a fresh ledger was created.'
          }
        };
      }
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (!legacyValue) {
        continue;
      }

      let data: LedgerData;

      try {
        data = normalizeLedgerData(JSON.parse(legacyValue));
      } catch {
        clearStorageKey(legacyKey);
        return {
          data: createDefaultLedgerData(),
          status: {
            state: 'corrupted',
            message: 'Legacy storage data was unreadable and has been cleared. The Ledger started with a fresh local snapshot.'
          }
        };
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      clearStorageKey(legacyKey);

      return {
        data,
        status: {
          state: 'migrated',
          message: 'Legacy Private Ledger data was migrated to The Ledger.'
        }
      };
    }

    return {
      data: createDefaultLedgerData(),
      status: ready('The Ledger is ready for a first local entry.')
    };
  } catch {
    return {
      data: createDefaultLedgerData(),
      status: {
        state: 'unavailable',
        message: 'This browser blocked local storage access, so changes will not survive a refresh.'
      }
    };
  }
}

export function saveLedgerData(data: LedgerData): StorageStatus {
  if (typeof window === 'undefined') {
    return {
      state: 'unavailable',
      message: 'Storage is unavailable outside the browser.'
    };
  }

  // Test storage availability first
  const writeTest = testStorageWrite();
  if (!writeTest.success) {
    return {
      state: 'unavailable',
      message: writeTest.error ?? 'Storage unavailable'
    };
  }

  // Check for quota issues (non-blocking warning)
  void checkStorageQuota().then((quotaResult) => {
    if (!quotaResult.hasQuota && typeof window !== 'undefined' && quotaResult.error) {
      console.warn(quotaResult.error);
    }
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return ready('Saved locally.');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'The Ledger could not write to local storage.';
    return {
      state: 'unavailable',
      message: `${errorMessage} Changes are in memory only. Export a backup immediately.`
    };
  }
}
