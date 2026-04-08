import type { EntryType } from '../config/prompts';

export type ThemeMode = 'light' | 'dark' | 'system';
export type StorageState = 'ready' | 'migrated' | 'unavailable' | 'corrupted';
export type NextStepConsistency = 'steady' | 'mixed' | 'reset';

export interface LedgerEntry {
  id: string;
  type: EntryType;
  date: string;
  periodLabel: string;
  headline: string;
  answers: Record<string, string>;
  domainTags: string[];
  stateTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftEntry {
  type: EntryType;
  entryId?: string;
  periodLabel: string;
  currentStep: number;
  headline: string;
  answers: Record<string, string>;
  domainTags: string[];
  stateTags: string[];
  startedAt: string;
  updatedAt: string;
}

export interface TrajectorySnapshot {
  lastKnownPriorities: string[];
  lastNextStep: string;
  lastWeeklyEntryId: string;
  lastEntryId: string;
  lastEntryDate: string;
  missedDays: number;
}

export interface InsightSnapshot {
  wins: string[];
  bottlenecks: string[];
  driftSignals: string[];
  suggestedFocus: string;
  nextStepConsistency: NextStepConsistency;
}

export interface LedgerSettings {
  theme: ThemeMode;
  autosave: boolean;
}

export interface LedgerData {
  appVersion: string;
  entries: LedgerEntry[];
  drafts: Partial<Record<EntryType, DraftEntry>>;
  currentTrajectory: TrajectorySnapshot;
  insights: InsightSnapshot;
  settings: LedgerSettings;
}

export interface EntryFilters {
  query: string;
  type: EntryType | 'all';
  domainTag: string | 'all';
  stateTag: string | 'all';
}

export interface StorageStatus {
  state: StorageState;
  message: string;
}

export interface ImportEnvelope {
  format: 'the-ledger-backup';
  version: 1;
  exportedAt: string;
  data: LedgerData;
}
