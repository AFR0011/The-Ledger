import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '../types/ledger';
import { deriveInsights, describeEntryInsightContext } from './insights';
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

describe('insights', () => {
  it('derives recurring domains, suggested focus, and drift signals deterministically', () => {
    const entries = [
      createEntry({
        id: 'daily-1',
        type: 'daily',
        date: '2026-04-08',
        periodLabel: 'Wed, Apr 8, 2026',
        answers: {
          evidence_of_progress: 'Shipped the install surface',
          current_thread: 'PWA hardening',
          next_right_step: 'Run the final regression pass'
        },
        domainTags: ['dev', 'research'],
        stateTags: ['win']
      }),
      createEntry({
        id: 'weekly-1',
        type: 'weekly',
        date: '2026-04-06',
        periodLabel: 'Week of Mon, Apr 6, 2026',
        answers: {
          bottlenecks_kept_showing_up: 'Too many late polish changes',
          reduce_or_constrain: 'Constrain scope before more styling',
          next_week_about: 'Tighten quality and regression coverage'
        },
        domainTags: ['dev'],
        stateTags: ['bottleneck', 'drift']
      }),
      createEntry({
        id: 'monthly-1',
        type: 'monthly',
        date: '2026-04-01',
        periodLabel: 'April 2026',
        answers: {
          improved: 'The app now has a stable offline shell'
        },
        domainTags: ['dev', 'mind'],
        stateTags: ['win']
      })
    ];

    const trajectory = deriveTrajectory(entries, new Date('2026-04-09T08:00:00.000Z'));
    const insights = deriveInsights(entries, trajectory);

    expect(insights.recurringDomains).toEqual(['dev']);
    expect(insights.suggestedFocus).toBe('Run the final regression pass');
    expect(insights.wins[0]).toContain('Shipped the install surface');
    expect(insights.bottlenecks[0]).toContain('Too many late polish changes');
    expect(insights.driftSignals).toContain('Recent weekly reviews are asking for stronger constraints.');
  });

  it('describes how an entry contributes to current insight surfaces', () => {
    const entries = [
      createEntry({
        id: 'daily-1',
        type: 'daily',
        date: '2026-04-08',
        answers: {
          evidence_of_progress: 'Shipped the final release shell',
          next_right_step: 'Verify the release build'
        },
        stateTags: ['win']
      }),
      createEntry({
        id: 'weekly-1',
        type: 'weekly',
        date: '2026-04-06',
        periodLabel: 'Week of Mon, Apr 6, 2026',
        answers: {
          next_week_about: 'Release hardening',
          reduce_or_constrain: 'Reduce churn'
        },
        stateTags: ['drift']
      })
    ];

    const trajectory = deriveTrajectory(entries, new Date('2026-04-08T08:00:00.000Z'));
    const context = describeEntryInsightContext(entries[1], trajectory);

    expect(context).toContain('Defines the current weekly signal');
    expect(context).toContain('Feeds drift tracking');
  });
});
