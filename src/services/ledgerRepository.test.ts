import { describe, expect, it } from 'vitest';
import type { DraftEntry } from '../types/ledger';
import {
  commitDraft,
  createCommitment,
  createDefaultLedgerData,
  createDraft,
  filterEntries,
  saveDraft,
  updateCommitmentStatus
} from './ledgerRepository';

function answerDraft(draft: DraftEntry, answers: Record<string, string>): DraftEntry {
  return {
    ...draft,
    answers: {
      ...draft.answers,
      ...answers
    }
  };
}

describe('ledgerRepository', () => {
  it('saves and commits a draft into a persisted entry', () => {
    const draft = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Finish the sprint one loop',
      actually_did: 'Built the wizard and repository',
      evidence_of_progress: 'Routes, storage, and validation all work',
      drift_or_fragment: 'Lost half an hour on icon sizing',
      operating_state: 'Focused',
      current_thread: 'Offline-first ledger',
      next_right_step: 'Run the verification suite'
    });

    const withDraft = saveDraft(createDefaultLedgerData(), 'daily', draft);
    const committed = commitDraft(withDraft, 'daily', draft);

    expect(withDraft.drafts.daily?.answers.supposed_to_matter).toBe('Finish the sprint one loop');
    expect(committed.data.entries).toHaveLength(1);
    expect(committed.data.drafts.daily).toBeUndefined();
    expect(committed.data.currentTrajectory.lastNextStep).toBe('Run the verification suite');
  });

  it('filters entries by text and tag', () => {
    const daily = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Ship the new history page',
      actually_did: 'Implemented search and filters',
      evidence_of_progress: 'History page is live',
      drift_or_fragment: 'None',
      operating_state: 'Clear',
      current_thread: 'History page',
      next_right_step: 'Test import/export'
    });
    daily.domainTags = ['career-research'];
    daily.stateTags = ['win'];

    const committed = commitDraft(createDefaultLedgerData(), 'daily', daily);
    const visible = filterEntries(committed.data.entries, {
      query: 'history',
      type: 'all',
      domainTag: 'career-research',
      stateTag: 'all'
    });

    expect(visible).toHaveLength(1);
    expect(visible[0].stateTags).toContain('win');
  });

  it('creates and resolves commitments from source entries', () => {
    const draft = answerDraft(createDraft('daily'), {
      supposed_to_matter: 'Finish the review surface',
      actually_did: 'Built commitment tracking',
      evidence_of_progress: 'Repository functions are covered',
      drift_or_fragment: 'None',
      operating_state: 'Clear',
      current_thread: 'Review queue',
      next_right_step: 'Verify the commitment controls'
    });

    const committed = commitDraft(createDefaultLedgerData(), 'daily', draft);
    const sourceEntry = committed.entry;
    const withCommitment = createCommitment(
      committed.data,
      sourceEntry.id,
      'Verify the commitment controls',
      'Tomorrow',
      new Date('2026-04-24T10:00:00.000Z')
    );
    const resolved = updateCommitmentStatus(
      withCommitment.data,
      withCommitment.commitment.id,
      'done',
      new Date('2026-04-24T11:00:00.000Z')
    );

    expect(withCommitment.data.commitments).toHaveLength(1);
    expect(withCommitment.commitment.sourceEntryId).toBe(sourceEntry.id);
    expect(withCommitment.commitment.duePeriod).toBe('Tomorrow');
    expect(resolved.commitments[0].status).toBe('done');
    expect(resolved.commitments[0].resolvedAt).toBe('2026-04-24T11:00:00.000Z');
  });

  it('keeps one canonical entry per local period and preserves older duplicates as legacy', () => {
    const first = createDraft('daily', undefined, new Date(2026, 6, 15, 8));
    first.answers = { ...first.answers, day_story: 'Morning version', meaningful_progress: 'A', inner_state: 'Steady', drift_struggle_learning: 'None', tomorrow_attention: 'Continue', freeform_reflection: '' };
    const firstCommit = commitDraft(createDefaultLedgerData(), 'daily', first, new Date('2026-07-15T08:00:00.000Z'));
    const second = createDraft('daily', undefined, new Date(2026, 6, 15, 20));
    second.answers = { ...second.answers, day_story: 'Evening version', meaningful_progress: 'B', inner_state: 'Steady', drift_struggle_learning: 'None', tomorrow_attention: 'Rest', freeform_reflection: '' };
    const secondCommit = commitDraft(firstCommit.data, 'daily', second, new Date('2026-07-15T20:00:00.000Z'));
    expect(secondCommit.data.entries).toHaveLength(1);
    expect(secondCommit.entry.answers.day_story).toBe('Evening version');
  });
});
