import type { LedgerData, StorageStatus } from '../types/ledger';
import { createDefaultLedgerData, normalizeLedgerData } from './ledgerRepository';

export const STORAGE_KEY = 'the-ledger:v1';
const LEGACY_STORAGE_KEYS = ['private-ledger:v1'];

function ready(message: string): StorageStatus {
  return {
    state: 'ready',
    message
  };
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

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return ready('Saved locally.');
  } catch {
    return {
      state: 'unavailable',
      message: 'The Ledger could not write to local storage. Changes are in memory only.'
    };
  }
}
