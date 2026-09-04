import type { LedgerData, RecoveryReason, RecoverySnapshot, StorageStatus } from '../types/ledger';
import { createDefaultLedgerData, normalizeLedgerData } from './ledgerRepository';
import { normalizeIntegrationOrigin } from './integrationOrigins';

export const STORAGE_KEY = 'the-ledger:v2';
export const RECOVERY_KEY = 'the-ledger:recovery:v1';
const LEGACY_STORAGE_KEYS = ['the-ledger:v1', 'private-ledger:v1'];
const MAX_RECOVERY_SNAPSHOTS = 8;
const RECOVERY_REASONS: RecoveryReason[] = ['corrupted-current', 'corrupted-legacy', 'pre-import', 'pre-restore'];

interface RecoveryStore {
  version: 1;
  snapshots: RecoverySnapshot[];
}

export interface LedgerLoadResult {
  data: LedgerData;
  status: StorageStatus;
  rawValue: string | null;
}

export interface LedgerSaveResult {
  status: StorageStatus;
  rawValue: string | null;
}

export interface StorageQuotaStatus {
  usage?: number;
  quota?: number;
  warning?: string;
}

function ready(message: string): StorageStatus {
  return { state: 'ready', message };
}

function unavailable(message: string): StorageStatus {
  return { state: 'unavailable', message, writeBlocked: true };
}

function newRecoveryId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `recovery-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseRecoveryStore(raw: string | null): RecoverySnapshot[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as Partial<RecoveryStore>;
  if (parsed.version !== 1 || !Array.isArray(parsed.snapshots)) throw new Error('The recovery store is invalid.');
  const snapshots = parsed.snapshots.filter((snapshot): snapshot is RecoverySnapshot => (
    typeof snapshot?.id === 'string' &&
    typeof snapshot?.capturedAt === 'string' &&
    RECOVERY_REASONS.includes(snapshot?.reason as RecoveryReason) &&
    typeof snapshot?.sourceKey === 'string' &&
    typeof snapshot?.rawValue === 'string'
  ));
  if (snapshots.length !== parsed.snapshots.length) throw new Error('The recovery store contains an invalid snapshot.');
  return snapshots;
}

export function loadRecoverySnapshots(): RecoverySnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseRecoveryStore(window.localStorage.getItem(RECOVERY_KEY));
  } catch {
    return [];
  }
}

export function preserveRecoverySnapshot(
  reason: RecoveryReason,
  sourceKey: string,
  rawValue: string
): RecoverySnapshot {
  if (typeof window === 'undefined') throw new Error('Recovery storage is unavailable outside the browser.');
  const snapshot: RecoverySnapshot = {
    id: newRecoveryId(),
    capturedAt: new Date().toISOString(),
    reason,
    sourceKey,
    rawValue
  };
  const existingSnapshots = parseRecoveryStore(window.localStorage.getItem(RECOVERY_KEY));
  const snapshots = [snapshot, ...existingSnapshots].slice(0, MAX_RECOVERY_SNAPSHOTS);
  window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ version: 1, snapshots } satisfies RecoveryStore));

  const verified = loadRecoverySnapshots().find((candidate) => candidate.id === snapshot.id);
  if (!verified || verified.rawValue !== rawValue) throw new Error('The recovery snapshot could not be verified.');
  return snapshot;
}

export function discardRecoverySnapshot(id: string): void {
  const snapshots = loadRecoverySnapshots().filter((snapshot) => snapshot.id !== id);
  window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ version: 1, snapshots } satisfies RecoveryStore));
}

export function parseRecoverySnapshot(snapshot: RecoverySnapshot): LedgerData {
  const parsed: unknown = JSON.parse(snapshot.rawValue);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('The recovery snapshot is not a ledger object.');
  const record = parsed as Record<string, unknown>;
  if (
    typeof record.appVersion !== 'string' ||
    !Array.isArray(record.entries) ||
    typeof record.drafts !== 'object' || record.drafts === null ||
    typeof record.settings !== 'object' || record.settings === null
  ) {
    throw new Error('The recovery snapshot is incomplete and can only be downloaded as raw data.');
  }
  const settings = record.settings as Record<string, unknown>;
  normalizeIntegrationOrigin(String(settings.contextOsUrl ?? ''));
  normalizeIntegrationOrigin(String(settings.socialOsUrl ?? ''));
  const normalized = normalizeLedgerData(parsed);
  if (normalized.entries.length !== record.entries.length) {
    throw new Error('The recovery snapshot contains invalid entries and can only be downloaded as raw data.');
  }
  return normalized;
}

export async function readStorageQuota(): Promise<StorageQuotaStatus> {
  if (typeof window === 'undefined' || !window.navigator?.storage?.estimate) return {};
  try {
    const estimate = await window.navigator.storage.estimate();
    const usage = estimate.usage;
    const quota = estimate.quota;
    const usageRatio = usage !== undefined && quota ? usage / quota : 0;
    return {
      usage,
      quota,
      warning: usageRatio >= 0.8
        ? `Browser storage is ${(usageRatio * 100).toFixed(0)}% full. Export a backup before space runs out.`
        : undefined
    };
  } catch {
    return {};
  }
}

function testStorageWrite(): { success: boolean; error?: string } {
  try {
    if (typeof window === 'undefined') return { success: false, error: 'Storage unavailable outside browser' };
    const testKey = '__the_ledger_storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return { success: true };
  } catch {
    return { success: false, error: 'Local storage is blocked or unavailable. Changes will not persist.' };
  }
}

function recoverCorruptValue(key: string, rawValue: string, reason: RecoveryReason, label: string): LedgerLoadResult {
  try {
    preserveRecoverySnapshot(reason, key, rawValue);
    window.localStorage.removeItem(key);
    return {
      data: createDefaultLedgerData(),
      rawValue: null,
      status: {
        state: 'corrupted',
        message: `${label} was unreadable. Its original bytes are preserved in Recovery before a fresh ledger was created.`
      }
    };
  } catch {
    return {
      data: createDefaultLedgerData(),
      rawValue,
      status: {
        state: 'corrupted',
        writeBlocked: true,
        message: `${label} was unreadable and could not be preserved. Writes are frozen; download the raw browser value before resolving it.`
      }
    };
  }
}

export function loadLedgerData(): LedgerLoadResult {
  if (typeof window === 'undefined') {
    return {
      data: createDefaultLedgerData(),
      rawValue: null,
      status: unavailable('Storage is unavailable outside the browser, so the app is running in memory only.')
    };
  }

  try {
    const currentValue = window.localStorage.getItem(STORAGE_KEY);
    if (currentValue) {
      try {
        return {
          data: normalizeLedgerData(JSON.parse(currentValue)),
          rawValue: currentValue,
          status: ready('The Ledger is using your local browser storage.')
        };
      } catch {
        return recoverCorruptValue(STORAGE_KEY, currentValue, 'corrupted-current', 'Stored data');
      }
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (!legacyValue) continue;

      let data: LedgerData;
      try {
        data = normalizeLedgerData(JSON.parse(legacyValue));
      } catch {
        return recoverCorruptValue(legacyKey, legacyValue, 'corrupted-legacy', 'Legacy storage data');
      }

      const serialized = JSON.stringify(data);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      window.localStorage.removeItem(legacyKey);
      return {
        data,
        rawValue: serialized,
        status: { state: 'migrated', message: 'Legacy Private Ledger data was migrated to The Ledger.' }
      };
    }

    return {
      data: createDefaultLedgerData(),
      rawValue: null,
      status: ready('The Ledger is ready for a first local entry.')
    };
  } catch {
    return {
      data: createDefaultLedgerData(),
      rawValue: null,
      status: unavailable('This browser blocked local storage access, so changes will not survive a refresh.')
    };
  }
}

export function saveLedgerData(
  data: LedgerData,
  options: { expectedRaw?: string | null; force?: boolean } = {}
): LedgerSaveResult {
  if (typeof window === 'undefined') {
    return { status: unavailable('Storage is unavailable outside the browser.'), rawValue: null };
  }

  const writeTest = testStorageWrite();
  if (!writeTest.success) {
    return { status: unavailable(writeTest.error ?? 'Storage unavailable'), rawValue: options.expectedRaw ?? null };
  }

  try {
    const currentRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!options.force && 'expectedRaw' in options && currentRaw !== options.expectedRaw) {
      return {
        rawValue: currentRaw,
        status: {
          state: 'conflicted',
          writeBlocked: true,
          message: 'Another tab changed this ledger. Writes are frozen until you export or reload this tab.'
        }
      };
    }

    const rawValue = JSON.stringify(data);
    window.localStorage.setItem(STORAGE_KEY, rawValue);
    return { status: ready('Saved locally.'), rawValue };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'The Ledger could not write to local storage.';
    return {
      rawValue: options.expectedRaw ?? null,
      status: unavailable(`${errorMessage} Changes are in memory only. Export a backup immediately.`)
    };
  }
}
