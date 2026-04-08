import { describe, expect, it } from 'vitest';
import { commitDraft, createDefaultLedgerData, createDraft } from './ledgerRepository';
import { exportLedgerData, parseLedgerImport } from './backup';

describe('backup helpers', () => {
  it('exports and imports a valid backup envelope', () => {
    const draft = createDraft('weekly');
    draft.answers.progressed = 'Shipped the first usable loop';
    draft.answers.proof_of_progress = 'The app now stores weekly entries';
    draft.answers.stayed_noise = 'Theme tweaks before core flow was stable';
    draft.answers.where_now = 'Past the scaffold stage';
    draft.answers.bottlenecks_kept_showing_up = 'Verification was blocked by missing toolchain';
    draft.answers.reduce_or_constrain = 'Reduce cosmetic work before tests pass';
    draft.answers.next_week_about = 'Hardening the app';

    const committed = commitDraft(createDefaultLedgerData(), 'weekly', draft);
    const backup = exportLedgerData(committed.data);
    const parsed = parseLedgerImport(backup);

    expect(parsed.format).toBe('the-ledger-backup');
    expect(parsed.data.entries).toHaveLength(1);
    expect(parsed.data.entries[0].type).toBe('weekly');
  });

  it('rejects invalid payloads', () => {
    expect(() => parseLedgerImport('{"format":"wrong"}')).toThrow('not a The Ledger backup');
  });

  it('rejects malformed entries instead of silently normalizing them away', () => {
    const invalidBackup = JSON.stringify({
      format: 'the-ledger-backup',
      version: 1,
      exportedAt: '2026-04-08T00:00:00.000Z',
      data: {
        appVersion: '1.0.0',
        entries: [
          {
            id: 'bad-entry',
            type: 'yearly',
            date: '2026-04-08'
          }
        ],
        drafts: {},
        currentTrajectory: {},
        insights: {},
        settings: {
          theme: 'dark',
          autosave: true
        }
      }
    });

    expect(() => parseLedgerImport(invalidBackup)).toThrow('entries are invalid or incomplete');
  });
});
