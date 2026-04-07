import type { LedgerData } from '../types/ledger';

const STORAGE_KEY = 'private-ledger:v1';

export const DEFAULT_LEDGER_DATA: LedgerData = {
  appVersion: '1.0.0',
  entries: [],
  drafts: {},
  currentTrajectory: {
    lastKnownPriorities: [],
    lastNextStep: '',
    lastWeeklyEntryId: ''
  },
  settings: {
    theme: 'system',
    autosave: true
  }
};

export function loadLedgerData(): LedgerData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_LEDGER_DATA;

  try {
    return JSON.parse(raw) as LedgerData;
  } catch {
    return DEFAULT_LEDGER_DATA;
  }
}

export function saveLedgerData(data: LedgerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
