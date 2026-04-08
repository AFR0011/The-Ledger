import type { ImportEnvelope, LedgerData } from '../types/ledger';
import { ENTRY_TYPES } from '../config/prompts';
import { normalizeLedgerData } from './ledgerRepository';

const BACKUP_FORMAT = 'the-ledger-backup';
const BACKUP_VERSION = 1 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function looksLikeLedgerData(value: unknown): value is LedgerData {
  return (
    isRecord(value) &&
    typeof value.appVersion === 'string' &&
    Array.isArray(value.entries) &&
    isRecord(value.drafts) &&
    isRecord(value.settings)
  );
}

function assertValidSettings(settings: unknown) {
  if (!isRecord(settings)) {
    throw new Error('Import failed because the backup payload is missing settings.');
  }

  if (!['light', 'dark', 'system'].includes(String(settings.theme))) {
    throw new Error('Import failed because the backup theme setting is invalid.');
  }

  if (typeof settings.autosave !== 'boolean') {
    throw new Error('Import failed because the backup autosave setting is invalid.');
  }
}

function assertStrictLedgerData(rawData: LedgerData, normalizedData: LedgerData) {
  assertValidSettings(rawData.settings);

  if (rawData.entries.length !== normalizedData.entries.length) {
    throw new Error('Import failed because one or more entries are invalid or incomplete.');
  }

  const rawDraftKeys = Object.keys(rawData.drafts);
  if (rawDraftKeys.some((key) => !ENTRY_TYPES.includes(key as (typeof ENTRY_TYPES)[number]))) {
    throw new Error('Import failed because the backup contains an unknown draft type.');
  }

  const normalizedDraftCount = Object.keys(normalizedData.drafts).length;
  if (rawDraftKeys.length !== normalizedDraftCount) {
    throw new Error('Import failed because one or more drafts are invalid or incomplete.');
  }
}

export function createBackupEnvelope(data: LedgerData): ImportEnvelope {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: normalizeLedgerData(data)
  };
}

export function exportLedgerData(data: LedgerData): string {
  return JSON.stringify(createBackupEnvelope(data), null, 2);
}

export function parseLedgerImport(rawText: string): ImportEnvelope {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Import failed because the file is not valid JSON.');
  }

  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    throw new Error('Import failed because this file is not a The Ledger backup.');
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`Import failed because backup version ${String(parsed.version)} is not supported.`);
  }

  if (!looksLikeLedgerData(parsed.data)) {
    throw new Error('Import failed because the backup payload is missing ledger data.');
  }

  const normalizedData = normalizeLedgerData(parsed.data);
  assertStrictLedgerData(parsed.data, normalizedData);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    data: normalizedData
  };
}
