import type { LedgerCommitment, LedgerEntry, ReviewQueueItem } from '../types/ledger';
import { pickFirstMeaningfulLine, summarizeText } from '../utils/text';

const REVIEW_LIMIT = 12;

function selectEntrySignal(entry: LedgerEntry, keys: string[], fallbackToHeadline = true): string {
  for (const key of keys) {
    const value = entry.answers[key];
    if (value) {
      return pickFirstMeaningfulLine(value);
    }
  }

  return fallbackToHeadline ? entry.headline : '';
}

function hasActiveCommitment(commitments: LedgerCommitment[], entryId: string, text: string): boolean {
  const normalizedText = text.trim().toLocaleLowerCase();

  return commitments.some(
    (commitment) =>
      commitment.sourceEntryId === entryId &&
      commitment.text.toLocaleLowerCase() === normalizedText &&
      commitment.status !== 'dropped'
  );
}

export function getEntryCommitmentCandidate(entry: LedgerEntry): string {
  return selectEntrySignal(entry, ['tomorrow_attention', 'next_right_step', 'next_week_about', 'next_month_direction', 'next_month_about']);
}

export function buildReviewQueue(entries: LedgerEntry[], commitments: LedgerCommitment[]): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = commitments
    .filter((commitment) => commitment.status === 'open' || commitment.status === 'carried')
    .slice(0, REVIEW_LIMIT)
    .map((commitment) => ({
      id: `commitment:${commitment.id}`,
      kind: 'commitment',
      title: commitment.status === 'carried' ? 'Carried commitment' : 'Open commitment',
      body: commitment.text,
      sourceEntryId: commitment.sourceEntryId,
      sourceEntryLabel: commitment.sourceEntryLabel,
      sourceEntryDate: commitment.sourceEntryDate,
      commitmentId: commitment.id,
      actionText: commitment.duePeriod ? `Due ${commitment.duePeriod}` : 'Needs resolution'
    }));

  for (const entry of entries.slice(0, 10)) {
    const nextStep = getEntryCommitmentCandidate(entry);
    if (nextStep && !hasActiveCommitment(commitments, entry.id, nextStep)) {
      items.push({
        id: `next-step:${entry.id}`,
        kind: 'next-step',
        title: 'Uncommitted next step',
        body: nextStep,
        sourceEntryId: entry.id,
        sourceEntryLabel: entry.periodLabel,
        sourceEntryDate: entry.date,
        actionText: 'Can become a commitment'
      });
    }

    const bottleneck = selectEntrySignal(entry, ['bottlenecks_kept_showing_up', 'regressed'], false);
    if ((entry.stateTags.includes('bottleneck') || bottleneck) && bottleneck) {
      items.push({
        id: `bottleneck:${entry.id}`,
        kind: 'bottleneck',
        title: 'Bottleneck to review',
        body: summarizeText(bottleneck, 140),
        sourceEntryId: entry.id,
        sourceEntryLabel: entry.periodLabel,
        sourceEntryDate: entry.date,
        actionText: 'Review constraint'
      });
    }

    const drift = selectEntrySignal(entry, ['drift_or_fragment', 'reduce_or_constrain'], false);
    if ((entry.stateTags.includes('drift') || drift) && drift) {
      items.push({
        id: `drift:${entry.id}`,
        kind: 'drift',
        title: 'Drift signal',
        body: summarizeText(drift, 140),
        sourceEntryId: entry.id,
        sourceEntryLabel: entry.periodLabel,
        sourceEntryDate: entry.date,
        actionText: 'Needs countermeasure'
      });
    }

    if (entry.stateTags.includes('decision')) {
      const decision = selectEntrySignal(entry, ['current_thread', 'next_right_step', 'next_week_about']) || entry.headline;
      items.push({
        id: `decision:${entry.id}`,
        kind: 'decision',
        title: 'Decision to revisit',
        body: summarizeText(decision, 140),
        sourceEntryId: entry.id,
        sourceEntryLabel: entry.periodLabel,
        sourceEntryDate: entry.date,
        actionText: 'Check outcome'
      });
    }
  }

  return items.slice(0, REVIEW_LIMIT);
}
