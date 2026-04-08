import type { LedgerEntry, TrajectorySnapshot } from '../types/ledger';
import { differenceInCalendarDays } from '../utils/date';
import { extractList, pickFirstMeaningfulLine } from '../utils/text';

export function createEmptyTrajectory(): TrajectorySnapshot {
  return {
    lastKnownPriorities: [],
    lastNextStep: '',
    lastWeeklyEntryId: '',
    lastWeeklySignal: '',
    lastCurrentThread: '',
    lastEntryId: '',
    lastEntryDate: '',
    missedDays: 0,
    reentryMessage: 'No entries yet. Start a fresh check-in to create a continuity baseline.'
  };
}

function newest(entries: LedgerEntry[], type?: LedgerEntry['type']): LedgerEntry | undefined {
  return entries.find((entry) => (type ? entry.type === type : true));
}

function buildReentryMessage(missedDays: number, nextStep: string, weeklySignal: string): string {
  if (missedDays <= 0) {
    return nextStep
      ? `No gap right now. Keep moving the thread: ${nextStep}`
      : 'No gap right now. Capture the next right step while the thread is still warm.';
  }

  if (missedDays === 1) {
    return nextStep
      ? `Short gap. Re-enter by starting with this step: ${nextStep}`
      : 'Short gap. Start with a daily entry and recover the next right step before opening new loops.';
  }

  if (missedDays <= 3) {
    return weeklySignal
      ? `A few days slipped. Re-anchor to the weekly signal: ${weeklySignal}`
      : 'A few days slipped. Re-anchor to the last clear direction before adding new commitments.';
  }

  return weeklySignal
    ? `Longer break. Reset around the weekly signal: ${weeklySignal}`
    : 'Longer break. Start broad, prune stale threads, and name what still matters now.';
}

export function deriveTrajectory(entries: LedgerEntry[], now = new Date()): TrajectorySnapshot {
  if (entries.length === 0) {
    return createEmptyTrajectory();
  }

  const latestEntry = newest(entries);
  const latestDaily = newest(entries, 'daily');
  const latestWeekly = newest(entries, 'weekly');
  const latestMonthly = newest(entries, 'monthly');

  if (!latestEntry) {
    return createEmptyTrajectory();
  }

  const prioritySource =
    latestDaily?.answers.supposed_to_matter ??
    latestWeekly?.answers.next_week_about ??
    latestMonthly?.answers.next_month_about ??
    latestEntry.headline;

  const nextStepSource =
    latestDaily?.answers.next_right_step ??
    latestWeekly?.answers.next_week_about ??
    latestMonthly?.answers.next_month_about ??
    latestEntry.headline;

  const currentThreadSource = latestDaily?.answers.current_thread ?? latestEntry.headline;
  const weeklySignalSource = latestWeekly?.answers.next_week_about ?? latestWeekly?.answers.where_now ?? '';
  const missedDays = differenceInCalendarDays(now, new Date(latestEntry.date));
  const nextStep = pickFirstMeaningfulLine(nextStepSource);
  const weeklySignal = pickFirstMeaningfulLine(weeklySignalSource);

  return {
    lastKnownPriorities: extractList(prioritySource, 3),
    lastNextStep: nextStep,
    lastWeeklyEntryId: latestWeekly?.id ?? '',
    lastWeeklySignal: weeklySignal,
    lastCurrentThread: pickFirstMeaningfulLine(currentThreadSource),
    lastEntryId: latestEntry.id,
    lastEntryDate: latestEntry.date,
    missedDays,
    reentryMessage: buildReentryMessage(missedDays, nextStep, weeklySignal)
  };
}
