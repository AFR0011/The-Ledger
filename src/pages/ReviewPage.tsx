import { Link } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { buildHandoffUrl, candidateToHandoff } from '../services/handoff';
import { formatDisplayDate } from '../utils/date';

export function ReviewPage() {
  const { data, getEntry, updateHandoffStatus } = useLedger();
  const pending = data.handoffCandidates.filter((candidate) => candidate.status === 'pending');

  const openCandidate = (id: string) => {
    const candidate = data.handoffCandidates.find((item) => item.id === id);
    const entry = candidate ? getEntry(candidate.sourceEntryId) : undefined;
    if (!candidate || !entry) return;
    const base = candidate.target === 'contextos' ? data.settings.contextOsUrl : data.settings.socialOsUrl;
    const route = candidate.target === 'contextos' ? '/handoff' : '/capture/handoff';
    window.open(buildHandoffUrl(base, route, candidateToHandoff(candidate, entry)), '_blank', 'noopener,noreferrer');
    updateHandoffStatus(candidate.id, 'opened');
  };

  return (
    <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Handoff proposals</p>
          <h2 className="mt-3 text-[28px] font-[510] tracking-[-0.04em] text-[var(--ink)]">Review before another system receives anything</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">Ledger keeps proposed next steps local. Opening one shows an editable approval screen in the owning system; it never creates a task or person record directly.</p>
          <div className="mt-4 flex flex-wrap gap-2"><TagPill tone="accent">{`${pending.length} pending`}</TagPill><TagPill>{`${data.handoffCandidates.length} total`}</TagPill></div>
        </div>

        {pending.length ? pending.map((candidate) => (
          <article key={candidate.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
            <div className="flex flex-wrap items-center gap-2"><TagPill tone="accent">{candidate.target}</TagPill><TagPill>{candidate.kind}</TagPill><span className="text-[12px] text-[var(--muted)]">{formatDisplayDate(candidate.sourceEntryDate)}</span></div>
            <h3 className="mt-3 text-[20px] font-[510] text-[var(--ink)]">{candidate.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[var(--text-secondary)]">{candidate.body}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" onClick={() => openCandidate(candidate.id)} type="button">Review in {candidate.target === 'contextos' ? 'ContextOS' : 'SocialOS'}</button>
              <button className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={() => updateHandoffStatus(candidate.id, 'dismissed')} type="button">Dismiss</button>
              <Link className="px-2 py-2.5 text-[13px] text-[var(--accent-bright)]" to={`/entries/${candidate.sourceEntryId}`}>Open source</Link>
            </div>
          </article>
        )) : <EmptyState title="No handoffs need review" description="A daily intention or deliberately selected social excerpt will appear here before it leaves Ledger." />}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Weekly review</p>
          <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">New weekly reviews are stored in ContextOS. Historical Ledger weeklies remain in entry history.</p>
          <a className="mt-4 inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" href={`${data.settings.contextOsUrl.replace(/\/+$/u, '')}/reviews`} rel="noreferrer" target="_blank">Open ContextOS Reviews</a>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Legacy commitments</p>
          <p className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">Preserved read-only for history. New work belongs in ContextOS.</p>
          <div className="mt-4 space-y-3">{data.commitments.slice(0, 8).map((item) => <div key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-3"><TagPill>{item.status}</TagPill><p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">{item.text}</p></div>)}</div>
        </section>
      </aside>
    </main>
  );
}
