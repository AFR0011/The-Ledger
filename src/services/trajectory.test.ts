import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '../types/ledger';
import { deriveTrajectory } from './trajectory';

function createEntry(overrides: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: overrides.type ?? 'daily',
    promptVersion: overrides.promptVersion ?? 1,
    date: overrides.date ?? '2026-04-08',
    periodKey: overrides.periodKey ?? '2026-04-08',
    periodLabel: overrides.periodLabel ?? 'Wed, Apr 8, 2026',
    headline: overrides.headline ?? '',
    answers: overrides.answers ?? {},
    domainTags: overrides.domainTags ?? [],
    stateTags: overrides.stateTags ?? [],
    createdAt: overrides.createdAt ?? '2026-04-08T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-08T09:00:00.000Z'
  };
}

describe('trajectory', () => {
  it('derives weekly signal, current thread, and short-gap re-entry guidance', () => {
    const entries = [
      createEntry({
        id: 'daily-1',
        type: 'daily',
        date: '2026-04-08',
        answers: {
          supposed_to_matter: 'Ship sprint three continuity work',
          current_thread: 'Continuity model',
          next_right_step: 'Validate the trajectory tests'
        }
      }),
      createEntry({
        id: 'weekly-1',
        type: 'weekly',
        date: '2026-04-06',
        periodLabel: 'Week of Mon, Apr 6, 2026',
        answers: {
          next_week_about: 'Tighten continuity and retrieval',
          where_now: 'Past the scaffold stage'
        }
      })
    ];

    const trajectory = deriveTrajectory(entries, new Date('2026-04-09T08:00:00.000Z'));

    expect(trajectory.lastNextStep).toBe('Validate the trajectory tests');
    expect(trajectory.lastCurrentThread).toBe('Continuity model');
    expect(trajectory.lastWeeklySignal).toBe('Tighten continuity and retrieval');
    expect(trajectory.reentryMessage).toContain('Short gap');
  });

  it('falls back to a reset-style message after a longer break', () => {
    const entries = [
      createEntry({
        id: 'monthly-1',
        type: 'monthly',
        date: '2026-04-01',
        periodLabel: 'April 2026',
        answers: {
          next_month_about: 'Rebuild the operating cadence'
        }
      })
    ];

    const trajectory = deriveTrajectory(entries, new Date('2026-04-08T08:00:00.000Z'));

    expect(trajectory.missedDays).toBe(7);
    expect(trajectory.reentryMessage).toContain('Longer break');
    expect(trajectory.lastWeeklySignal).toBe('');
  });
});
