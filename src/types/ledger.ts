import type { EntryType } from '../config/prompts';

export type ThemeMode = 'light' | 'dark' | 'system';
export type StorageState = 'ready' | 'migrated' | 'unavailable' | 'corrupted';
export type NextStepConsistency = 'steady' | 'mixed' | 'reset';
export type CommitmentStatus = 'open' | 'carried' | 'done' | 'dropped';
export type ReviewQueueKind = 'commitment' | 'next-step' | 'bottleneck' | 'drift' | 'decision';
export type ThreadSource = 'domain' | 'state' | 'current-thread';

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

export interface LedgerCommitment {
  id: string;
  text: string;
  sourceEntryId: string;
  sourceEntryLabel: string;
  sourceEntryDate: string;
  duePeriod: string;
  status: CommitmentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
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
  lastWeeklySignal: string;
  lastCurrentThread: string;
  lastEntryId: string;
  lastEntryDate: string;
  missedDays: number;
  reentryMessage: string;
}

export interface InsightSnapshot {
  wins: string[];
  bottlenecks: string[];
  driftSignals: string[];
  recurringDomains: string[];
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
  commitments: LedgerCommitment[];
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

export interface ReviewQueueItem {
  id: string;
  kind: ReviewQueueKind;
  title: string;
  body: string;
  sourceEntryId: string;
  sourceEntryLabel: string;
  sourceEntryDate: string;
  commitmentId?: string;
  actionText?: string;
}

export interface ThreadSummary {
  id: string;
  label: string;
  source: ThreadSource;
  entries: LedgerEntry[];
  count: number;
  lastEntryDate: string;
  latestEntryId: string;
  latestSignal: string;
}

export interface ImportEnvelope {
  format: 'the-ledger-backup';
  version: 1;
  exportedAt: string;
  data: LedgerData;
}
