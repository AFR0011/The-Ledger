import type { LedgerEntry, ThreadSource, ThreadSummary } from '../types/ledger';
import { pickFirstMeaningfulLine, summarizeText } from '../utils/text';

interface ThreadBucket {
  id: string;
  label: string;
  source: ThreadSource;
  entries: LedgerEntry[];
}

function makeThreadId(source: ThreadSource, label: string): string {
  return `${source}:${label.trim().toLocaleLowerCase()}`;
}

function addToBucket(buckets: Map<string, ThreadBucket>, source: ThreadSource, label: string, entry: LedgerEntry) {
  const normalizedLabel = label.trim();
  if (!normalizedLabel) {
    return;
  }

  const id = makeThreadId(source, normalizedLabel);
  const bucket = buckets.get(id);

  if (bucket) {
    bucket.entries.push(entry);
    return;
  }

  buckets.set(id, {
    id,
    label: normalizedLabel,
    source,
    entries: [entry]
  });
}

function getCurrentThread(entry: LedgerEntry): string {
  return pickFirstMeaningfulLine(entry.answers.current_thread ?? '');
}

function getLatestSignal(entry: LedgerEntry): string {
  const signal =
    entry.answers.next_right_step ??
    entry.answers.next_week_about ??
    entry.answers.next_month_about ??
    entry.answers.current_thread ??
    entry.headline;

  return summarizeText(pickFirstMeaningfulLine(signal) || entry.periodLabel, 120);
}

export function deriveThreadSummaries(entries: LedgerEntry[]): ThreadSummary[] {
  const buckets = new Map<string, ThreadBucket>();

  for (const entry of entries) {
    for (const tag of entry.domainTags) {
      addToBucket(buckets, 'domain', tag, entry);
    }

    for (const tag of entry.stateTags) {
      addToBucket(buckets, 'state', tag, entry);
    }

    addToBucket(buckets, 'current-thread', getCurrentThread(entry), entry);
  }

  return [...buckets.values()]
    .map((bucket) => {
      const latestEntry = bucket.entries[0];

      return {
        id: bucket.id,
        label: bucket.label,
        source: bucket.source,
        entries: bucket.entries,
        count: bucket.entries.length,
        lastEntryDate: latestEntry?.date ?? '',
        latestEntryId: latestEntry?.id ?? '',
        latestSignal: latestEntry ? getLatestSignal(latestEntry) : ''
      };
    })
    .sort((left, right) => right.count - left.count || right.lastEntryDate.localeCompare(left.lastEntryDate) || left.label.localeCompare(right.label));
}
