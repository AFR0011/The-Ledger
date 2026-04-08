import { beforeEach, describe, expect, it } from 'vitest';
import { commitDraft, createDefaultLedgerData, createDraft } from './ledgerRepository';
import { loadLedgerData, STORAGE_KEY } from './ledgerStorage';

describe('ledgerStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clears corrupted current storage and starts fresh', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken json');

    const result = loadLedgerData();

    expect(result.status.state).toBe('corrupted');
    expect(result.data.entries).toHaveLength(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('migrates valid legacy storage into the new key', () => {
    const draft = createDraft('daily');
    draft.answers.supposed_to_matter = 'Finish migration coverage';
    draft.answers.actually_did = 'Moved the stored payload';
    draft.answers.evidence_of_progress = 'The legacy key was read';
    draft.answers.drift_or_fragment = 'None';
    draft.answers.operating_state = 'Clear';
    draft.answers.current_thread = 'Storage migration';
    draft.answers.next_right_step = 'Verify the new storage key';

    const committed = commitDraft(createDefaultLedgerData(), 'daily', draft);
    window.localStorage.setItem('private-ledger:v1', JSON.stringify(committed.data));

    const result = loadLedgerData();

    expect(result.status.state).toBe('migrated');
    expect(result.data.entries).toHaveLength(1);
    expect(window.localStorage.getItem('private-ledger:v1')).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});
