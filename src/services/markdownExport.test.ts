import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '../types/ledger';
import { entryMarkdownPath, mergeLedgerMarkdown, renderEntryMarkdown } from './markdownExport';

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    id: 'entry-1', type: 'daily', promptVersion: 2, date: '2026-07-15', periodKey: '2026-07-15',
    periodLabel: 'Wed, Jul 15, 2026', headline: '',
    answers: { day_story: 'A clear day.', meaningful_progress: 'Moved the thesis.', inner_state: 'Steady.', drift_struggle_learning: 'Less context switching.', tomorrow_attention: 'Protect tomorrow morning.', freeform_reflection: '' },
    domainTags: ['career-research'], stateTags: ['clarity'], createdAt: '2026-07-15T08:00:00.000Z', updatedAt: '2026-07-15T09:00:00.000Z',
    ...overrides
  };
}

describe('LifeOS Markdown export', () => {
  it('uses the canonical path and omits blank optional reflection', () => {
    const value = entry();
    expect(entryMarkdownPath(value)).toBe('04 Journal/Daily/2026/07/2026-07-15.md');
    expect(renderEntryMarkdown(value)).not.toContain('## Freeform reflection');
  });

  it('updates managed regions while preserving manual notes', () => {
    const first = renderEntryMarkdown(entry());
    const existing = `${first.trimEnd()}\n\nA manual note that must survive.\n`;
    const updated = renderEntryMarkdown(entry({ answers: { ...entry().answers, day_story: 'A revised day.' }, updatedAt: '2026-07-15T10:00:00.000Z' }));
    const result = mergeLedgerMarkdown(existing, updated, 'entry-1');
    expect(result.status).toBe('updated');
    expect(result.content).toContain('A revised day.');
    expect(result.content).toContain('A manual note that must survive.');
  });

  it('does not overwrite an unmanaged existing note without approval', () => {
    expect(mergeLedgerMarkdown('# Existing journal', renderEntryMarkdown(entry()), 'entry-1').status).toBe('conflict');
  });
});
