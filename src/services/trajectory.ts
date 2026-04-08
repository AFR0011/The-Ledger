import type { LedgerEntry, TrajectorySnapshot } from '../types/ledger';
import { differenceInCalendarDays } from '../utils/date';
import { extractList, pickFirstMeaningfulLine } from '../utils/text';

export function createEmptyTrajectory(): TrajectorySnapshot {
  return {
    lastKnownPriorities: [],
    lastNextStep: '',
    lastWeeklyEntryId: '',
    lastEntryId: '',
    lastEntryDate: '',
    missedDays: 0
  };
}

function newest(entries: LedgerEntry[], type?: LedgerEntry['type']): LedgerEntry | undefined {
  return entries.find((entry) => (type ? entry.type === type : true));
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

  return {
    lastKnownPriorities: extractList(prioritySource, 3),
    lastNextStep: pickFirstMeaningfulLine(nextStepSource),
    lastWeeklyEntryId: latestWeekly?.id ?? '',
    lastEntryId: latestEntry.id,
    lastEntryDate: latestEntry.date,
    missedDays: differenceInCalendarDays(now, new Date(latestEntry.date))
  };
}
