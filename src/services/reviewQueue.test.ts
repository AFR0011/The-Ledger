import { describe, expect, it } from 'vitest';
import type { DraftEntry } from '../types/ledger';
import { commitDraft, createCommitment, createDefaultLedgerData, createDraft } from './ledgerRepository';
import { buildReviewQueue } from './reviewQueue';

function answerDraft(draft: DraftEntry, answers: Record<string, string>): DraftEntry {
  return {
    ...draft,
    answers: {
      ...draft.answers,
      ...answers
    }
  };
}

describe('reviewQueue', () => {
  it('surfaces active commitments before uncommitted next steps and drift signals', () => {
    const draft = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Move the project forward',
      actually_did: 'Added a review loop',
      evidence_of_progress: 'Review queue exists',
      drift_or_fragment: 'Spent too long on nav copy',
      operating_state: 'Focused',
      current_thread: 'Ledger review',
      next_right_step: 'Run the verification ladder'
    });
    draft.stateTags = ['drift'];

    const committed = commitDraft(createDefaultLedgerData(), 'daily', draft);
    const withCommitment = createCommitment(committed.data, committed.entry.id, 'Run the verification ladder');
    const queue = buildReviewQueue(withCommitment.data.entries, withCommitment.data.commitments);

    expect(queue[0].kind).toBe('commitment');
    expect(queue.some((item) => item.kind === 'next-step')).toBe(false);
    expect(queue.some((item) => item.kind === 'drift')).toBe(true);
  });
});
