import { describe, expect, it } from 'vitest';
import type { DraftEntry } from '../types/ledger';
import { commitDraft, createDefaultLedgerData, createDraft } from './ledgerRepository';
import { deriveThreadSummaries } from './threads';

function answerDraft(draft: DraftEntry, answers: Record<string, string>): DraftEntry {
  return {
    ...draft,
    answers: {
      ...draft.answers,
      ...answers
    }
  };
}

describe('threads', () => {
  it('groups entries by domain tags, state tags, and named current threads', () => {
    const first = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Build the thread view',
      actually_did: 'Grouped tagged entries',
      evidence_of_progress: 'Thread summaries exist',
      drift_or_fragment: 'None',
      operating_state: 'Clear',
      current_thread: 'Local continuity',
      next_right_step: 'Add tests'
    });
    first.domainTags = ['dev'];
    first.stateTags = ['win'];

    const second = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Keep building',
      actually_did: 'Added another entry',
      evidence_of_progress: 'More data',
      drift_or_fragment: 'None',
      operating_state: 'Clear',
      current_thread: 'Local continuity',
      next_right_step: 'Run build'
    });
    second.domainTags = ['dev'];

    const firstCommit = commitDraft(createDefaultLedgerData(), 'daily', first, new Date('2026-04-23T10:00:00.000Z'));
    const secondCommit = commitDraft(firstCommit.data, 'daily', second, new Date('2026-04-24T10:00:00.000Z'));
    const threads = deriveThreadSummaries(secondCommit.data.entries);

    expect(threads.find((thread) => thread.id === 'domain:dev')?.count).toBe(2);
    expect(threads.find((thread) => thread.id === 'current-thread:local continuity')?.count).toBe(2);
    expect(threads.find((thread) => thread.id === 'state:win')?.count).toBe(1);
  });
});
