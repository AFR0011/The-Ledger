import {
  CURRENT_PROMPT_VERSION,
  DOMAIN_TAGS,
  ENTRY_TYPES,
  LEGACY_DOMAIN_TAG_MAP,
  STATE_TAGS,
  getEntryBlueprint,
  type EntryType,
  type PromptVersion
} from '../config/prompts';
import type {
  CommitmentStatus,
  DraftEntry,
  EntryFilters,
  HandoffCandidate,
  HandoffKind,
  HandoffStatus,
  HandoffTarget,
  LedgerCommitment,
  LedgerData,
  LedgerEntry,
  LedgerSettings,
  PublicationRecord
} from '../types/ledger';
import { formatPeriodLabel, getPeriodKey, parseLocalDate, toIsoDate } from '../utils/date';
import { normalizeForSearch, summarizeText } from '../utils/text';
import { createEmptyInsights, deriveInsights } from './insights';
import { createEmptyTrajectory, deriveTrajectory } from './trajectory';

export const APP_DATA_VERSION = '2.0.0';
export const DEFAULT_CONTEXTOS_URL = 'https://context-os-red.vercel.app';
export const DEFAULT_SOCIALOS_URL = 'https://social-os-tau.vercel.app';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function normalizeTags(value: unknown, known: readonly string[], migrateLegacy = false): string[] {
  if (!Array.isArray(value)) return [];
  const tags = value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  return unique(tags.map((tag) => (migrateLegacy ? LEGACY_DOMAIN_TAG_MAP[tag] ?? tag : tag))).filter(
    (tag) => known.includes(tag) || !tag.startsWith('__')
  );
}

function sortEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((left, right) => right.date.localeCompare(left.date) || right.updatedAt.localeCompare(left.updatedAt));
}

function promptVersion(value: unknown): PromptVersion {
  return value === 1 ? 1 : CURRENT_PROMPT_VERSION;
}

function normalizeAnswers(type: EntryType, version: PromptVersion, value: unknown): Record<string, string> {
  const answers = isRecord(value)
    ? Object.fromEntries(Object.entries(value).map(([key, answer]) => [key, typeof answer === 'string' ? answer : '']))
    : {};
  for (const prompt of getEntryBlueprint(type, version).prompts) {
    if (!(prompt.key in answers)) answers[prompt.key] = '';
  }
  return answers;
}

function normalizePublication(value: unknown): PublicationRecord | undefined {
  if (!isRecord(value) || typeof value.path !== 'string') return undefined;
  const status = ['not-published', 'synced', 'stale', 'downloaded', 'conflict'].includes(String(value.status))
    ? (value.status as PublicationRecord['status'])
    : 'not-published';
  return {
    status,
    path: value.path,
    lastPublishedAt: typeof value.lastPublishedAt === 'string' ? value.lastPublishedAt : undefined,
    publishedSourceUpdatedAt: typeof value.publishedSourceUpdatedAt === 'string' ? value.publishedSourceUpdatedAt : undefined,
    lastDownloadedAt: typeof value.lastDownloadedAt === 'string' ? value.lastDownloadedAt : undefined,
    message: typeof value.message === 'string' ? value.message : undefined
  };
}

function normalizeEntry(value: unknown): LedgerEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !ENTRY_TYPES.includes(value.type as EntryType)) return null;
  const type = value.type as EntryType;
  const version = value.promptVersion === 1 || value.promptVersion === 2 ? value.promptVersion : 1;
  const date = typeof value.date === 'string' ? value.date : toIsoDate(new Date());
  const dateValue = parseLocalDate(date);
  const entry: LedgerEntry = {
    id: value.id,
    type,
    promptVersion: version,
    date,
    periodKey: typeof value.periodKey === 'string' ? value.periodKey : getPeriodKey(type, dateValue),
    periodLabel:
      typeof value.periodLabel === 'string' && value.periodLabel.trim() ? value.periodLabel : formatPeriodLabel(type, dateValue),
    headline: typeof value.headline === 'string' ? value.headline : '',
    answers: normalizeAnswers(type, version, value.answers),
    domainTags: normalizeTags(value.domainTags, DOMAIN_TAGS, true),
    stateTags: normalizeTags(value.stateTags, STATE_TAGS),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    publication: normalizePublication(value.publication)
  };
  if (typeof value.legacyDuplicateOf === 'string') entry.legacyDuplicateOf = value.legacyDuplicateOf;
  return entry;
}

function markLegacyDuplicates(entries: LedgerEntry[]): LedgerEntry[] {
  const groups = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = `${entry.type}:${entry.periodKey}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return entries.map((entry) => {
    const group = [...(groups.get(`${entry.type}:${entry.periodKey}`) ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const canonical = group[0];
    if (!canonical || canonical.id === entry.id) {
      const canonicalEntry = { ...entry };
      delete canonicalEntry.legacyDuplicateOf;
      return canonicalEntry;
    }
    return { ...entry, legacyDuplicateOf: canonical.id };
  });
}

function normalizeCommitment(value: unknown): LedgerCommitment | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.text !== 'string' || !value.text.trim()) return null;
  const status: CommitmentStatus =
    value.status === 'carried' || value.status === 'done' || value.status === 'dropped' ? value.status : 'open';
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString();
  return {
    id: value.id,
    text: value.text.trim(),
    sourceEntryId: typeof value.sourceEntryId === 'string' ? value.sourceEntryId : '',
    sourceEntryLabel: typeof value.sourceEntryLabel === 'string' ? value.sourceEntryLabel : 'Unknown entry',
    sourceEntryDate: typeof value.sourceEntryDate === 'string' ? value.sourceEntryDate : '',
    duePeriod: typeof value.duePeriod === 'string' ? value.duePeriod.trim() : '',
    status,
    createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
    resolvedAt: typeof value.resolvedAt === 'string' ? value.resolvedAt : undefined
  };
}

function normalizeHandoff(value: unknown): HandoffCandidate | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.body !== 'string') return null;
  const target: HandoffTarget = value.target === 'socialos' ? 'socialos' : 'contextos';
  const allowedKinds: HandoffKind[] = ['next-action', 'project-update', 'note', 'social-reflection', 'follow-up'];
  const kind = allowedKinds.includes(value.kind as HandoffKind) ? (value.kind as HandoffKind) : 'note';
  const status: HandoffStatus = value.status === 'opened' || value.status === 'dismissed' ? value.status : 'pending';
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString();
  return {
    id: value.id,
    target,
    kind,
    title: typeof value.title === 'string' ? value.title.slice(0, 160) : 'Ledger handoff',
    body: value.body,
    area: typeof value.area === 'string' ? value.area : undefined,
    status,
    sourceEntryId: typeof value.sourceEntryId === 'string' ? value.sourceEntryId : '',
    sourceEntryLabel: typeof value.sourceEntryLabel === 'string' ? value.sourceEntryLabel : 'Ledger entry',
    sourceEntryDate: typeof value.sourceEntryDate === 'string' ? value.sourceEntryDate : '',
    createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt
  };
}

function normalizeDraft(value: unknown, type: EntryType): DraftEntry | null {
  if (!isRecord(value)) return null;
  const version = promptVersion(value.promptVersion);
  const date = typeof value.date === 'string' ? value.date : toIsoDate(new Date());
  const parsedDate = parseLocalDate(date);
  return {
    type,
    promptVersion: version,
    entryId: typeof value.entryId === 'string' ? value.entryId : undefined,
    date,
    periodKey: typeof value.periodKey === 'string' ? value.periodKey : getPeriodKey(type, parsedDate),
    periodLabel:
      typeof value.periodLabel === 'string' && value.periodLabel.trim() ? value.periodLabel : formatPeriodLabel(type, parsedDate),
    currentStep: typeof value.currentStep === 'number' && value.currentStep >= 0 ? value.currentStep : 0,
    headline: typeof value.headline === 'string' ? value.headline : '',
    answers: normalizeAnswers(type, version, value.answers),
    domainTags: normalizeTags(value.domainTags, DOMAIN_TAGS, true),
    stateTags: normalizeTags(value.stateTags, STATE_TAGS),
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeSettings(value: unknown): LedgerSettings {
  const record = isRecord(value) ? value : {};
  return {
    theme: record.theme === 'light' || record.theme === 'system' ? record.theme : 'dark',
    autosave: typeof record.autosave === 'boolean' ? record.autosave : true,
    contextOsUrl: typeof record.contextOsUrl === 'string' && record.contextOsUrl.trim() ? record.contextOsUrl : DEFAULT_CONTEXTOS_URL,
    socialOsUrl: typeof record.socialOsUrl === 'string' && record.socialOsUrl.trim() ? record.socialOsUrl : DEFAULT_SOCIALOS_URL
  };
}

export function createDefaultLedgerData(): LedgerData {
  return {
    appVersion: APP_DATA_VERSION,
    entries: [],
    commitments: [],
    handoffCandidates: [],
    drafts: {},
    currentTrajectory: createEmptyTrajectory(),
    insights: createEmptyInsights(),
    settings: normalizeSettings(null)
  };
}

export function hydrateDerivedState(data: LedgerData): LedgerData {
  const entries = sortEntries(markLegacyDuplicates(data.entries)).map((entry) =>
    entry.publication?.status === 'synced' && entry.publication.publishedSourceUpdatedAt !== entry.updatedAt
      ? { ...entry, publication: { ...entry.publication, status: 'stale' as const } }
      : entry
  );
  const currentTrajectory = deriveTrajectory(entries);
  return {
    ...data,
    appVersion: APP_DATA_VERSION,
    entries,
    commitments: [...data.commitments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    handoffCandidates: [...data.handoffCandidates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    currentTrajectory,
    insights: deriveInsights(entries, currentTrajectory)
  };
}

export function normalizeLedgerData(value: unknown): LedgerData {
  if (!isRecord(value)) return createDefaultLedgerData();
  const entries = Array.isArray(value.entries) ? value.entries.map(normalizeEntry).filter((entry): entry is LedgerEntry => Boolean(entry)) : [];
  const commitments = Array.isArray(value.commitments)
    ? value.commitments.map(normalizeCommitment).filter((item): item is LedgerCommitment => Boolean(item))
    : [];
  const handoffCandidates = Array.isArray(value.handoffCandidates)
    ? value.handoffCandidates.map(normalizeHandoff).filter((item): item is HandoffCandidate => Boolean(item))
    : [];
  const drafts = ENTRY_TYPES.reduce<LedgerData['drafts']>((result, type) => {
    const draft = normalizeDraft(isRecord(value.drafts) ? value.drafts[type] : undefined, type);
    if (draft) result[type] = draft;
    return result;
  }, {});
  return hydrateDerivedState({
    appVersion: APP_DATA_VERSION,
    entries,
    commitments,
    handoffCandidates,
    drafts,
    currentTrajectory: createEmptyTrajectory(),
    insights: createEmptyInsights(),
    settings: normalizeSettings(value.settings)
  });
}

export function getCanonicalEntryForPeriod(data: LedgerData, type: EntryType, date = new Date()): LedgerEntry | undefined {
  const key = getPeriodKey(type, date);
  return data.entries.find((entry) => entry.type === type && entry.periodKey === key && !entry.legacyDuplicateOf);
}

export function createDraft(type: EntryType, entry?: LedgerEntry, now = new Date()): DraftEntry {
  const date = entry?.date ?? toIsoDate(now);
  const parsedDate = parseLocalDate(date);
  const version = entry?.promptVersion ?? CURRENT_PROMPT_VERSION;
  return {
    type,
    promptVersion: version,
    entryId: entry?.id,
    date,
    periodKey: entry?.periodKey ?? getPeriodKey(type, parsedDate),
    periodLabel: entry?.periodLabel ?? formatPeriodLabel(type, parsedDate),
    currentStep: 0,
    headline: entry?.headline ?? '',
    answers: normalizeAnswers(type, version, entry?.answers),
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
  const parsedDate = parseLocalDate(draft.date);
  const nextDraft = {
    ...draft,
    type,
    periodKey: getPeriodKey(type, parsedDate),
    periodLabel: formatPeriodLabel(type, parsedDate),
    answers: normalizeAnswers(type, draft.promptVersion, draft.answers),
    domainTags: normalizeTags(draft.domainTags, DOMAIN_TAGS, true),
    stateTags: normalizeTags(draft.stateTags, STATE_TAGS),
    updatedAt: now.toISOString()
  };
  return { ...data, drafts: { ...data.drafts, [type]: nextDraft } };
}

export function discardDraft(data: LedgerData, type: EntryType): LedgerData {
  const drafts = { ...data.drafts };
  delete drafts[type];
  return { ...data, drafts };
}

function withDailyCandidate(data: LedgerData, entry: LedgerEntry, now: Date): LedgerData {
  const body = entry.answers.tomorrow_attention?.trim();
  if (entry.type !== 'daily' || !body) return data;
  const id = `ledger-${entry.id}-contextos-next-action`;
  const existing = data.handoffCandidates.find((candidate) => candidate.id === id);
  const candidate: HandoffCandidate = {
    id,
    target: 'contextos',
    kind: 'next-action',
    title: entry.headline.trim() || `Attention after ${entry.date}`,
    body,
    area: entry.domainTags[0],
    status: existing?.status === 'dismissed' ? 'dismissed' : 'pending',
    sourceEntryId: entry.id,
    sourceEntryLabel: entry.periodLabel,
    sourceEntryDate: entry.date,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };
  return { ...data, handoffCandidates: [candidate, ...data.handoffCandidates.filter((item) => item.id !== id)] };
}

export function commitDraft(data: LedgerData, type: EntryType, draft: DraftEntry, now = new Date()): { data: LedgerData; entry: LedgerEntry } {
  const parsedDate = parseLocalDate(draft.date);
  const periodKey = getPeriodKey(type, parsedDate);
  const existing = draft.entryId
    ? getEntryById(data, draft.entryId)
    : data.entries.find((entry) => entry.type === type && entry.periodKey === periodKey && !entry.legacyDuplicateOf);
  const entry: LedgerEntry = {
    id: existing?.id ?? crypto.randomUUID(),
    type,
    promptVersion: draft.promptVersion,
    date: draft.date,
    periodKey,
    periodLabel: formatPeriodLabel(type, parsedDate),
    headline: draft.headline.trim(),
    answers: normalizeAnswers(type, draft.promptVersion, draft.answers),
    domainTags: normalizeTags(draft.domainTags, DOMAIN_TAGS, true),
    stateTags: normalizeTags(draft.stateTags, STATE_TAGS),
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    publication: existing?.publication
  };
  let nextData: LedgerData = {
    ...discardDraft(data, type),
    entries: [entry, ...data.entries.filter((candidate) => candidate.id !== entry.id)]
  };
  nextData = withDailyCandidate(nextData, entry, now);
  return { data: hydrateDerivedState(nextData), entry };
}

export function deleteEntry(data: LedgerData, entryId: string): LedgerData {
  return hydrateDerivedState({
    ...data,
    entries: data.entries.filter((entry) => entry.id !== entryId),
    commitments: data.commitments.filter((item) => item.sourceEntryId !== entryId),
    handoffCandidates: data.handoffCandidates.filter((item) => item.sourceEntryId !== entryId)
  });
}

export function createCommitment(data: LedgerData, sourceEntryId: string, text: string, duePeriod = '', now = new Date()) {
  const sourceEntry = getEntryById(data, sourceEntryId);
  if (!sourceEntry || !text.trim()) throw new Error('Commitment text and source entry are required.');
  const duplicate = data.commitments.find((item) => item.sourceEntryId === sourceEntryId && item.text.toLowerCase() === text.trim().toLowerCase());
  if (duplicate) return { data, commitment: duplicate };
  const timestamp = now.toISOString();
  const commitment: LedgerCommitment = {
    id: crypto.randomUUID(), text: text.trim(), sourceEntryId, sourceEntryLabel: sourceEntry.periodLabel,
    sourceEntryDate: sourceEntry.date, duePeriod: duePeriod.trim(), status: 'open', createdAt: timestamp, updatedAt: timestamp
  };
  return { data: hydrateDerivedState({ ...data, commitments: [commitment, ...data.commitments] }), commitment };
}

export function updateCommitmentStatus(data: LedgerData, commitmentId: string, status: CommitmentStatus, now = new Date()): LedgerData {
  const timestamp = now.toISOString();
  return hydrateDerivedState({
    ...data,
    commitments: data.commitments.map((item) => item.id === commitmentId
      ? { ...item, status, updatedAt: timestamp, resolvedAt: status === 'done' || status === 'dropped' ? timestamp : undefined }
      : item)
  });
}

export function createHandoffCandidate(
  data: LedgerData,
  input: Pick<HandoffCandidate, 'target' | 'kind' | 'title' | 'body' | 'area' | 'sourceEntryId'>,
  now = new Date()
): { data: LedgerData; candidate: HandoffCandidate } {
  const sourceEntry = getEntryById(data, input.sourceEntryId);
  if (!sourceEntry || !input.body.trim()) throw new Error('Handoff content and source entry are required.');
  const id = `ledger-${sourceEntry.id}-${input.target}-${input.kind}`;
  const existing = data.handoffCandidates.find((item) => item.id === id);
  const candidate: HandoffCandidate = {
    id,
    target: input.target,
    kind: input.kind,
    title: input.title.trim().slice(0, 160) || 'Ledger handoff',
    body: input.body.trim(),
    area: input.area,
    status: 'pending',
    sourceEntryId: sourceEntry.id,
    sourceEntryLabel: sourceEntry.periodLabel,
    sourceEntryDate: sourceEntry.date,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };
  return {
    data: hydrateDerivedState({ ...data, handoffCandidates: [candidate, ...data.handoffCandidates.filter((item) => item.id !== id)] }),
    candidate
  };
}

export function updateHandoffStatus(data: LedgerData, id: string, status: HandoffStatus, now = new Date()): LedgerData {
  return hydrateDerivedState({
    ...data,
    handoffCandidates: data.handoffCandidates.map((item) => item.id === id ? { ...item, status, updatedAt: now.toISOString() } : item)
  });
}

export function updateEntryPublication(data: LedgerData, entryId: string, publication: PublicationRecord): LedgerData {
  return hydrateDerivedState({ ...data, entries: data.entries.map((entry) => entry.id === entryId ? { ...entry, publication } : entry) });
}

export function updateSettings(data: LedgerData, patch: Partial<LedgerSettings>): LedgerData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

export function replaceLedgerData(data: LedgerData): LedgerData {
  return hydrateDerivedState({ ...data, appVersion: APP_DATA_VERSION });
}

export function filterEntries(entries: LedgerEntry[], filters: EntryFilters): LedgerEntry[] {
  const query = normalizeForSearch(filters.query);
  return entries.filter((entry) => {
    if (filters.type !== 'all' && entry.type !== filters.type) return false;
    if (filters.domainTag !== 'all' && !entry.domainTags.includes(filters.domainTag)) return false;
    if (filters.stateTag !== 'all' && !entry.stateTags.includes(filters.stateTag)) return false;
    if (!query) return true;
    return normalizeForSearch([entry.periodLabel, entry.headline, ...Object.values(entry.answers), ...entry.domainTags, ...entry.stateTags].join(' ')).includes(query);
  });
}

export function buildEntrySummary(entry: LedgerEntry): string {
  const preferred = entry.answers.tomorrow_attention ?? entry.answers.next_right_step ?? entry.answers.next_week_about ??
    entry.answers.next_month_direction ?? entry.answers.next_month_about ?? Object.values(entry.answers).find(Boolean) ?? '';
  return summarizeText(entry.headline || preferred || entry.periodLabel, 110);
}
