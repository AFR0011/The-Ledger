import type { EntryType, PromptVersion } from '../config/prompts';

export type ThemeMode = 'light' | 'dark' | 'system';
export type StorageState = 'ready' | 'migrated' | 'unavailable' | 'corrupted';
export type NextStepConsistency = 'steady' | 'mixed' | 'reset';
export type CommitmentStatus = 'open' | 'carried' | 'done' | 'dropped';
export type ReviewQueueKind = 'commitment' | 'next-step' | 'bottleneck' | 'drift' | 'decision';
export type ThreadSource = 'domain' | 'state' | 'current-thread';
export type PublicationStatus = 'not-published' | 'synced' | 'stale' | 'downloaded' | 'conflict';
export type HandoffTarget = 'contextos' | 'socialos';
export type HandoffKind = 'next-action' | 'project-update' | 'note' | 'social-reflection' | 'follow-up';
export type HandoffStatus = 'pending' | 'opened' | 'dismissed';

export interface PublicationRecord {
  status: PublicationStatus;
  path: string;
  lastPublishedAt?: string;
  publishedSourceUpdatedAt?: string;
  lastDownloadedAt?: string;
  message?: string;
}

export interface LedgerEntry {
  id: string;
  type: EntryType;
  promptVersion: PromptVersion;
  date: string;
  periodKey: string;
  periodLabel: string;
  headline: string;
  answers: Record<string, string>;
  domainTags: string[];
  stateTags: string[];
  createdAt: string;
  updatedAt: string;
  legacyDuplicateOf?: string;
  publication?: PublicationRecord;
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

export interface HandoffCandidate {
  id: string;
  target: HandoffTarget;
  kind: HandoffKind;
  title: string;
  body: string;
  area?: string;
  status: HandoffStatus;
  sourceEntryId: string;
  sourceEntryLabel: string;
  sourceEntryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftEntry {
  type: EntryType;
  promptVersion: PromptVersion;
  entryId?: string;
  date: string;
  periodKey: string;
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
  contextOsUrl: string;
  socialOsUrl: string;
}

export interface LedgerData {
  appVersion: string;
  entries: LedgerEntry[];
  commitments: LedgerCommitment[];
  handoffCandidates: HandoffCandidate[];
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
  version: 1 | 2;
  exportedAt: string;
  data: LedgerData;
}
