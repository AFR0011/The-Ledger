import type { EntryType } from '../config/prompts';

export interface LedgerEntry {
  id: string;
  type: EntryType;
  date: string;
  periodLabel: string;
  headline?: string;
  answers: Record<string, string>;
  domainTags: string[];
  stateTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftEntry {
  periodLabel: string;
  currentStep: number;
  headline: string;
  answers: Record<string, string>;
  domainTags: string[];
  stateTags: string[];
  updatedAt: string;
}

export interface LedgerData {
  appVersion: string;
  entries: LedgerEntry[];
  drafts: Partial<Record<EntryType, DraftEntry>>;
  currentTrajectory: {
    lastKnownPriorities: string[];
    lastNextStep: string;
    lastWeeklyEntryId: string;
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    autosave: boolean;
  };
}
