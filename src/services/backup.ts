import type { ImportEnvelope, LedgerData } from '../types/ledger';
import { normalizeLedgerData } from './ledgerRepository';

const BACKUP_FORMAT = 'the-ledger-backup';
const BACKUP_VERSION = 1 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function looksLikeLedgerData(value: unknown): value is LedgerData {
  return isRecord(value) && Array.isArray(value.entries) && isRecord(value.drafts) && isRecord(value.settings);
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

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    data: normalizeLedgerData(parsed.data)
  };
}
