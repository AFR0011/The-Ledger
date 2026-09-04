import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commitDraft, createDefaultLedgerData, createDraft } from './ledgerRepository';
import { loadLedgerData, loadRecoverySnapshots, parseRecoverySnapshot, readStorageQuota, RECOVERY_KEY, saveLedgerData, STORAGE_KEY } from './ledgerStorage';

describe('ledgerStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('preserves corrupted current storage before clearing it', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken json');

    const result = loadLedgerData();

    expect(result.status.state).toBe('corrupted');
    expect(result.data.entries).toHaveLength(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadRecoverySnapshots()[0]).toMatchObject({ reason: 'corrupted-current', rawValue: '{broken json' });
  });

  it('freezes writes and keeps corrupt bytes when recovery preservation fails', () => {
    window.localStorage.setItem(STORAGE_KEY, '{keep me');
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === RECOVERY_KEY) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return originalSetItem.call(this, key, value);
    });

    const result = loadLedgerData();

    expect(result.status.writeBlocked).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{keep me');
    vi.restoreAllMocks();
  });

  it('does not overwrite a malformed recovery store while handling corrupt current data', () => {
    window.localStorage.setItem(RECOVERY_KEY, '{existing broken recovery');
    window.localStorage.setItem(STORAGE_KEY, '{current broken data');

    const result = loadLedgerData();

    expect(result.status.writeBlocked).toBe(true);
    expect(window.localStorage.getItem(RECOVERY_KEY)).toBe('{existing broken recovery');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{current broken data');
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

  it('detects a stale expected value instead of overwriting another tab', () => {
    const first = JSON.stringify(createDefaultLedgerData());
    window.localStorage.setItem(STORAGE_KEY, first);
    const otherTab = JSON.stringify({ ...createDefaultLedgerData(), appVersion: 'other-tab' });
    window.localStorage.setItem(STORAGE_KEY, otherTab);

    const result = saveLedgerData(createDefaultLedgerData(), { expectedRaw: first });

    expect(result.status.state).toBe('conflicted');
    expect(result.status.writeBlocked).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(otherTab);
  });

  it('surfaces a storage quota warning before exhaustion', async () => {
    Object.defineProperty(window.navigator, 'storage', {
      configurable: true,
      value: { estimate: vi.fn().mockResolvedValue({ usage: 850, quota: 1_000 }) }
    });

    await expect(readStorageQuota()).resolves.toMatchObject({ usage: 850, quota: 1_000, warning: expect.stringContaining('85%') });
  });

  it('does not normalize malformed raw recovery bytes into a restorable empty ledger', () => {
    expect(() => parseRecoverySnapshot({
      id: 'synthetic-recovery',
      capturedAt: '2026-09-04T00:00:00.000Z',
      reason: 'corrupted-current',
      sourceKey: STORAGE_KEY,
      rawValue: '[]'
    })).toThrow(/can only be downloaded|not a ledger object/u);
  });
});
