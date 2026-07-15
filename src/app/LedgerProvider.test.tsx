import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraft } from '../services/ledgerRepository';
import { STORAGE_KEY } from '../services/ledgerStorage';
import type { DraftEntry, LedgerData } from '../types/ledger';
import { LedgerProvider, useLedger } from './LedgerProvider';

function completedDailyDraft(): DraftEntry {
  const draft = createDraft('daily', undefined, new Date('2026-07-16T18:00:00+03:00'));
  return {
    ...draft,
    headline: 'Provider persistence regression',
    answers: {
      ...draft.answers,
      day_story: 'Finished a real entry through the provider.',
      meaningful_progress: 'Captured the persistence failure.',
      inner_state: 'Focused.',
      drift_struggle_learning: 'React may defer functional state updaters.',
      tomorrow_attention: 'Verify the repaired finish flow.'
    }
  };
}

function FinishHarness() {
  const { commitDraft, data, saveDraft } = useLedger();

  const finish = () => {
    const draft = completedDailyDraft();
    saveDraft('daily', draft);
    commitDraft('daily', draft);
  };

  return (
    <>
      <button type="button" onClick={finish}>
        Finish entry
      </button>
      <output aria-label="entry count">{data.entries.length}</output>
    </>
  );
}

describe('LedgerProvider persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  it('returns and persists a committed entry before the finish handler continues', async () => {
    render(
      <LedgerProvider>
        <FinishHarness />
      </LedgerProvider>
    );

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Finish entry' }))).not.toThrow();

    await waitFor(() => expect(screen.getByLabelText('entry count')).toHaveTextContent('1'));
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as LedgerData | null;
    expect(stored?.entries).toHaveLength(1);
    expect(stored?.drafts.daily).toBeUndefined();
  });
});
