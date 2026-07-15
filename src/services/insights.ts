import type { LedgerEntry, InsightSnapshot, NextStepConsistency, TrajectorySnapshot } from '../types/ledger';
import { pickFirstMeaningfulLine, summarizeText, tokenize } from '../utils/text';

function buildEmptyInsights(): InsightSnapshot {
  return {
    wins: [],
    bottlenecks: [],
    driftSignals: [],
    recurringDomains: [],
    suggestedFocus: '',
    nextStepConsistency: 'reset'
  };
}

function selectSignal(entry: LedgerEntry, keys: string[]): string {
  for (const key of keys) {
    const value = entry.answers[key];
    if (value) {
      return pickFirstMeaningfulLine(value);
    }
  }

  return entry.headline;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function compareTokenOverlap(a: string, b: string): number {
  const first = new Set(tokenize(a));
  const second = new Set(tokenize(b));

  if (first.size === 0 || second.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const token of first) {
    if (second.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(first.size, second.size);
}

function deriveRecurringDomains(entries: LedgerEntry[]): string[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.domainTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([tag]) => tag);
}

function deriveConsistency(entries: LedgerEntry[]): NextStepConsistency {
  const nextSteps = entries
    .map((entry) =>
      selectSignal(entry, ['tomorrow_attention', 'next_right_step', 'next_week_about', 'next_month_direction', 'next_month_about', 'day_story', 'current_thread'])
    )
    .filter(Boolean)
    .slice(0, 3);

  if (nextSteps.length < 2) {
    return 'reset';
  }

  const overlap = compareTokenOverlap(nextSteps[0], nextSteps[1]);

  if (overlap >= 0.45) {
    return 'steady';
  }

  return 'mixed';
}

export function createEmptyInsights(): InsightSnapshot {
  return buildEmptyInsights();
}

export function describeEntryInsightContext(entry: LedgerEntry, trajectory: TrajectorySnapshot): string[] {
  const context: string[] = [];

  if (entry.id === trajectory.lastEntryId) {
    context.push('Latest continuity anchor');
  }

  if (entry.id === trajectory.lastWeeklyEntryId) {
    context.push('Defines the current weekly signal');
  }

  if (
    entry.stateTags.includes('win') ||
    Boolean(entry.answers.evidence_of_progress) ||
    Boolean(entry.answers.meaningful_progress) ||
    Boolean(entry.answers.proof_of_progress) ||
    Boolean(entry.answers.improved)
  ) {
    context.push('Feeds the wins signal');
  }

  if (
    entry.stateTags.includes('bottleneck') ||
    Boolean(entry.answers.bottlenecks_kept_showing_up) ||
    Boolean(entry.answers.drift_struggle_learning) ||
    Boolean(entry.answers.regressed)
  ) {
    context.push('Feeds bottleneck tracking');
  }

  if (
    entry.stateTags.includes('drift') ||
    Boolean(entry.answers.drift_or_fragment) ||
    Boolean(entry.answers.drift_struggle_learning) ||
    Boolean(entry.answers.reduce_or_constrain)
  ) {
    context.push('Feeds drift tracking');
  }

  return dedupe(context);
}

export function deriveInsights(entries: LedgerEntry[], trajectory: TrajectorySnapshot): InsightSnapshot {
  if (entries.length === 0) {
    return buildEmptyInsights();
  }

  const recentEntries = entries.slice(0, 8);

  const wins = dedupe(
    recentEntries
      .filter(
        (entry) =>
          entry.stateTags.includes('win') ||
          Boolean(entry.answers.evidence_of_progress) ||
          Boolean(entry.answers.meaningful_progress) ||
          Boolean(entry.answers.proof_of_progress) ||
          Boolean(entry.answers.improved)
      )
      .map((entry) => `${entry.periodLabel}: ${summarizeText(selectSignal(entry, ['meaningful_progress', 'evidence_of_progress', 'proof_of_progress', 'improved', 'built']))}`)
  ).slice(0, 3);

  const bottlenecks = dedupe(
    recentEntries
      .filter(
        (entry) =>
          entry.stateTags.includes('bottleneck') ||
          entry.stateTags.includes('drift') ||
          Boolean(entry.answers.drift_or_fragment) ||
          Boolean(entry.answers.drift_struggle_learning) ||
          Boolean(entry.answers.bottlenecks_kept_showing_up) ||
          Boolean(entry.answers.regressed)
      )
      .map((entry) => `${entry.periodLabel}: ${summarizeText(selectSignal(entry, ['drift_struggle_learning', 'bottlenecks_kept_showing_up', 'drift_or_fragment', 'regressed']))}`)
  ).slice(0, 3);

  const driftSignals = dedupe(
    [
      trajectory.missedDays > 1 ? `Continuity gap: ${trajectory.missedDays} days since the last entry.` : '',
      recentEntries.filter((entry) => entry.stateTags.includes('drift')).length >= 2
        ? 'Drift has shown up repeatedly in recent entries.'
        : '',
      recentEntries.some((entry) => entry.answers.reduce_or_constrain)
        ? 'Recent weekly reviews are asking for stronger constraints.'
        : ''
    ].filter(Boolean)
  ).slice(0, 3);

  return {
    wins,
    bottlenecks,
    driftSignals,
    recurringDomains: deriveRecurringDomains(recentEntries),
    suggestedFocus:
      trajectory.lastNextStep ||
      selectSignal(recentEntries[0], ['tomorrow_attention', 'next_right_step', 'next_week_about', 'next_month_direction', 'next_month_about']) ||
      'Start a fresh entry to recover your next right step.',
    nextStepConsistency: deriveConsistency(recentEntries)
  };
}
