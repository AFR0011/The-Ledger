import { describe, expect, it } from 'vitest';
import { decodeHandoff, encodeHandoff, validateHandoff, type LifeOsHandoffV1 } from './handoff';

const payload: LifeOsHandoffV1 = {
  schema: 'lifeos-handoff', version: 1, id: 'ledger-entry-1-contextos-next-action', source: 'the-ledger',
  target: 'contextos', kind: 'next-action', title: 'Protect the thesis block', body: 'Schedule one uninterrupted thesis block.',
  area: 'career-research', sourceRef: { entryId: 'entry-1', entryType: 'daily', date: '2026-07-15' },
  createdAt: '2026-07-15T10:00:00.000Z', sensitivity: 'private'
};

describe('lifeos handoffs', () => {
  it('round-trips multilingual UTF-8 content', () => {
    const encoded = encodeHandoff({ ...payload, body: 'Reflect with Настя and سلام before acting.' });
    expect(decodeHandoff(encoded, 'contextos').body).toContain('Настя');
    expect(decodeHandoff(encoded).body).toContain('سلام');
  });

  it('rejects wrong targets and oversized bodies', () => {
    expect(() => decodeHandoff(encodeHandoff(payload), 'socialos')).toThrow(/not intended/u);
    expect(() => validateHandoff({ ...payload, body: 'x'.repeat(6_001) })).toThrow(/6,000/u);
  });
});
