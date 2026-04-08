import { DOMAIN_TAGS, ENTRY_BLUEPRINTS, ENTRY_TYPES, STATE_TAGS, type EntryType } from '../config/prompts';
import type { DraftEntry, EntryFilters, LedgerData, LedgerEntry, LedgerSettings } from '../types/ledger';
import { formatPeriodLabel, toIsoDate } from '../utils/date';
import { normalizeForSearch, summarizeText } from '../utils/text';
import { createEmptyInsights, deriveInsights } from './insights';
import { createEmptyTrajectory, deriveTrajectory } from './trajectory';

export const APP_DATA_VERSION = '1.0.0';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function sanitizeTags(tags: string[], allowed: readonly string[]): string[] {
  return unique(tags.filter((tag) => allowed.includes(tag)));
}

function sortEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function normalizeAnswers(type: EntryType, answers: Record<string, string>): Record<string, string> {
  const promptKeys = ENTRY_BLUEPRINTS[type].prompts.map((prompt) => prompt.key);

  return Object.fromEntries(
    promptKeys.map((key) => [key, typeof answers[key] === 'string' ? answers[key].trim() : ''])
  );
}

function normalizeEntry(value: unknown): LedgerEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string') {
    return null;
  }

  if (!ENTRY_TYPES.includes(value.type as EntryType)) {
    return null;
  }

  const entryType = value.type as EntryType;
  const answers = isRecord(value.answers)
    ? Object.fromEntries(
        Object.entries(value.answers).map(([key, answer]) => [key, typeof answer === 'string' ? answer : ''])
      )
    : {};

  return {
    id: value.id,
    type: entryType,
    date: typeof value.date === 'string' ? value.date : toIsoDate(new Date()),
    periodLabel:
      typeof value.periodLabel === 'string' && value.periodLabel.trim()
        ? value.periodLabel
        : formatPeriodLabel(entryType, new Date()),
    headline: typeof value.headline === 'string' ? value.headline : '',
    answers: normalizeAnswers(entryType, answers),
    domainTags: sanitizeTags(
      Array.isArray(value.domainTags) ? value.domainTags.filter((tag): tag is string => typeof tag === 'string') : [],
      DOMAIN_TAGS
    ),
    stateTags: sanitizeTags(
      Array.isArray(value.stateTags) ? value.stateTags.filter((tag): tag is string => typeof tag === 'string') : [],
      STATE_TAGS
    ),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeDraft(value: unknown, type: EntryType): DraftEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const answers = isRecord(value.answers)
    ? Object.fromEntries(
        Object.entries(value.answers).map(([key, answer]) => [key, typeof answer === 'string' ? answer : ''])
      )
    : {};

  return {
    type,
    entryId: typeof value.entryId === 'string' ? value.entryId : undefined,
    periodLabel:
      typeof value.periodLabel === 'string' && value.periodLabel.trim()
        ? value.periodLabel
        : formatPeriodLabel(type, new Date()),
    currentStep: typeof value.currentStep === 'number' && value.currentStep >= 0 ? value.currentStep : 0,
    headline: typeof value.headline === 'string' ? value.headline : '',
    answers: normalizeAnswers(type, answers),
    domainTags: sanitizeTags(
      Array.isArray(value.domainTags) ? value.domainTags.filter((tag): tag is string => typeof tag === 'string') : [],
      DOMAIN_TAGS
    ),
    stateTags: sanitizeTags(
      Array.isArray(value.stateTags) ? value.stateTags.filter((tag): tag is string => typeof tag === 'string') : [],
      STATE_TAGS
    ),
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeSettings(value: unknown): LedgerSettings {
  if (!isRecord(value)) {
    return {
      theme: 'dark',
      autosave: true
    };
  }

  return {
    theme: value.theme === 'light' || value.theme === 'dark' || value.theme === 'system' ? value.theme : 'dark',
    autosave: typeof value.autosave === 'boolean' ? value.autosave : true
  };
}

export function createDefaultLedgerData(): LedgerData {
  return {
    appVersion: APP_DATA_VERSION,
    entries: [],
    drafts: {},
    currentTrajectory: createEmptyTrajectory(),
    insights: createEmptyInsights(),
    settings: {
      theme: 'dark',
      autosave: true
    }
  };
}

export function hydrateDerivedState(data: LedgerData): LedgerData {
  const entries = sortEntries(data.entries);
  const currentTrajectory = deriveTrajectory(entries);
  const insights = deriveInsights(entries, currentTrajectory);

  return {
    ...data,
    appVersion: APP_DATA_VERSION,
    entries,
    currentTrajectory,
    insights
  };
}

export function normalizeLedgerData(value: unknown): LedgerData {
  if (!isRecord(value)) {
    return createDefaultLedgerData();
  }

  const entries = Array.isArray(value.entries)
    ? value.entries.map((entry) => normalizeEntry(entry)).filter((entry): entry is LedgerEntry => entry !== null)
    : [];

  const drafts = ENTRY_TYPES.reduce<LedgerData['drafts']>((nextDrafts, type) => {
    const rawDraft = isRecord(value.drafts) ? value.drafts[type] : undefined;
    const draft = normalizeDraft(rawDraft, type);
    if (draft) {
      nextDrafts[type] = draft;
    }
    return nextDrafts;
  }, {});

  return hydrateDerivedState({
    appVersion: APP_DATA_VERSION,
    entries,
    drafts,
    currentTrajectory: createEmptyTrajectory(),
    insights: createEmptyInsights(),
    settings: normalizeSettings(value.settings)
  });
}

export function createDraft(type: EntryType, entry?: LedgerEntry, now = new Date()): DraftEntry {
  return {
    type,
    entryId: entry?.id,
    periodLabel: entry?.periodLabel ?? formatPeriodLabel(type, now),
    currentStep: 0,
    headline: entry?.headline ?? '',
    answers: normalizeAnswers(type, entry?.answers ?? {}),
    domainTags: entry?.domainTags ?? [],
    stateTags: entry?.stateTags ?? [],
    startedAt: entry?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };
}

export function getEntryById(data: LedgerData, entryId: string): LedgerEntry | undefined {
  return data.entries.find((entry) => entry.id === entryId);
}

export function saveDraft(data: LedgerData, type: EntryType, draft: DraftEntry, now = new Date()): LedgerData {
  return {
    ...data,
    drafts: {
      ...data.drafts,
      [type]: {
        ...draft,
        type,
        currentStep: Math.max(draft.currentStep, 0),
        periodLabel: draft.periodLabel.trim() || formatPeriodLabel(type, now),
        answers: normalizeAnswers(type, draft.answers),
        domainTags: sanitizeTags(draft.domainTags, DOMAIN_TAGS),
        stateTags: sanitizeTags(draft.stateTags, STATE_TAGS),
        updatedAt: now.toISOString()
      }
    }
  };
}

export function discardDraft(data: LedgerData, type: EntryType): LedgerData {
  const drafts = { ...data.drafts };
  delete drafts[type];

  return {
    ...data,
    drafts
  };
}

export function commitDraft(
  data: LedgerData,
  type: EntryType,
  draft: DraftEntry,
  now = new Date()
): { data: LedgerData; entry: LedgerEntry } {
  const existingEntry = draft.entryId ? getEntryById(data, draft.entryId) : undefined;
  const entry: LedgerEntry = {
    id: existingEntry?.id ?? crypto.randomUUID(),
    type,
    date: existingEntry?.date ?? toIsoDate(now),
    periodLabel: draft.periodLabel.trim() || formatPeriodLabel(type, now),
    headline: draft.headline.trim(),
    answers: normalizeAnswers(type, draft.answers),
    domainTags: sanitizeTags(draft.domainTags, DOMAIN_TAGS),
    stateTags: sanitizeTags(draft.stateTags, STATE_TAGS),
    createdAt: existingEntry?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };

  const nextEntries = sortEntries([entry, ...data.entries.filter((candidate) => candidate.id !== entry.id)]);
  const nextData = hydrateDerivedState({
    ...discardDraft(data, type),
    entries: nextEntries
  });

  return {
    data: nextData,
    entry
  };
}

export function deleteEntry(data: LedgerData, entryId: string): LedgerData {
  return hydrateDerivedState({
    ...data,
    entries: data.entries.filter((entry) => entry.id !== entryId)
  });
}

export function updateSettings(data: LedgerData, patch: Partial<LedgerSettings>): LedgerData {
  return {
    ...data,
    settings: {
      ...data.settings,
      ...patch
    }
  };
}

export function replaceLedgerData(data: LedgerData): LedgerData {
  return hydrateDerivedState({
    ...data,
    appVersion: APP_DATA_VERSION
  });
}

export function filterEntries(entries: LedgerEntry[], filters: EntryFilters): LedgerEntry[] {
  const query = normalizeForSearch(filters.query);

  return entries.filter((entry) => {
    if (filters.type !== 'all' && entry.type !== filters.type) {
      return false;
    }

    if (filters.domainTag !== 'all' && !entry.domainTags.includes(filters.domainTag)) {
      return false;
    }

    if (filters.stateTag !== 'all' && !entry.stateTags.includes(filters.stateTag)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = normalizeForSearch(
      [entry.periodLabel, entry.headline, ...Object.values(entry.answers), ...entry.domainTags, ...entry.stateTags].join(' ')
    );

    return haystack.includes(query);
  });
}

export function buildEntrySummary(entry: LedgerEntry): string {
  const preferredAnswer =
    entry.answers.next_right_step ??
    entry.answers.next_week_about ??
    entry.answers.next_month_about ??
    Object.values(entry.answers).find(Boolean) ??
    '';

  return summarizeText(entry.headline || preferredAnswer || entry.periodLabel, 110);
}
