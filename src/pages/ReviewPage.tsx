import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { buildReviewQueue } from '../services/reviewQueue';
import type { CommitmentStatus, ReviewQueueItem } from '../types/ledger';
import { formatDisplayDate } from '../utils/date';

const STATUS_LABELS: Record<CommitmentStatus, string> = {
  open: 'open',
  carried: 'carried',
  done: 'done',
  dropped: 'dropped'
};

function CommitmentControls({
  commitmentId,
  onUpdate
}: {
  commitmentId: string;
  onUpdate: (commitmentId: string, status: CommitmentStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-medium text-[var(--accent-bright)]"
        onClick={() => onUpdate(commitmentId, 'done')}
        type="button"
      >
        Done
      </button>
      <button
        className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-3 py-2 text-[13px] font-medium text-[var(--ink)]"
        onClick={() => onUpdate(commitmentId, 'carried')}
        type="button"
      >
        Carry
      </button>
      <button
        className="min-h-11 rounded-md border border-[var(--border-subtle)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] font-medium text-[var(--danger-ink)]"
        onClick={() => onUpdate(commitmentId, 'dropped')}
        type="button"
      >
        Drop
      </button>
    </div>
  );
}

function ReviewQueueCard({
  item,
  onCreateCommitment,
  onUpdateCommitment
}: {
  item: ReviewQueueItem;
  onCreateCommitment: (item: ReviewQueueItem) => void;
  onUpdateCommitment: (commitmentId: string, status: CommitmentStatus) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TagPill tone={item.kind === 'commitment' ? 'accent' : 'warm'}>{item.kind}</TagPill>
            <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(item.sourceEntryDate)}</span>
          </div>
          <h3 className="mt-3 text-[20px] font-[510] tracking-[-0.02em] text-[var(--ink)]">{item.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[var(--text-secondary)]">{item.body}</p>
        </div>
        {item.actionText ? (
          <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-3 py-2 text-[12px] text-[var(--muted)]">
            {item.actionText}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-[13px] font-medium text-[var(--accent-bright)]" to={`/entries/${item.sourceEntryId}`}>
          Open {item.sourceEntryLabel}
        </Link>
        {item.commitmentId ? (
          <CommitmentControls commitmentId={item.commitmentId} onUpdate={onUpdateCommitment} />
        ) : item.kind === 'next-step' ? (
          <button
            className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
            onClick={() => onCreateCommitment(item)}
            type="button"
          >
            Track commitment
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ReviewPage() {
  const { createCommitment, data, updateCommitmentStatus } = useLedger();
  const reviewQueue = useMemo(() => buildReviewQueue(data.entries, data.commitments), [data.commitments, data.entries]);
  const activeCommitments = data.commitments.filter((commitment) => commitment.status === 'open' || commitment.status === 'carried');

  const createFromQueue = (item: ReviewQueueItem) => {
    createCommitment(item.sourceEntryId, item.body);
  };

  if (data.entries.length === 0) {
    return (
      <EmptyState
        title="No review queue yet"
        description="Finish a few entries and this surface will collect open next steps, bottlenecks, drift signals, decisions, and commitments."
        action={
          <Link
            className="inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
            to="/entry/daily"
          >
            Start daily entry
          </Link>
        }
      />
    );
  }

  return (
    <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Review queue</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-[510] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
                Resolve what the ledger keeps surfacing
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
                Open commitments stay at the top. Recent next steps, bottlenecks, drift, and decisions follow from finished entries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TagPill tone="accent">{`${activeCommitments.length} active`}</TagPill>
              <TagPill>{`${reviewQueue.length} queued`}</TagPill>
            </div>
          </div>
        </div>

        {reviewQueue.length > 0 ? (
          reviewQueue.map((item) => (
            <ReviewQueueCard
              key={item.id}
              item={item}
              onCreateCommitment={createFromQueue}
              onUpdateCommitment={updateCommitmentStatus}
            />
          ))
        ) : (
          <EmptyState
            title="Nothing needs review"
            description="The queue is clear. New commitments and tagged signals will appear here after future entries."
          />
        )}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Commitments</p>
          <h3 className="mt-3 text-[22px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Follow-through ledger</h3>
          <div className="mt-4 space-y-3">
            {data.commitments.length > 0 ? (
              data.commitments.slice(0, 8).map((commitment) => (
                <div key={commitment.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TagPill tone={commitment.status === 'done' ? 'accent' : commitment.status === 'dropped' ? 'warm' : undefined}>
                      {STATUS_LABELS[commitment.status]}
                    </TagPill>
                    <span className="text-[12px] text-[var(--muted)]">{formatDisplayDate(commitment.sourceEntryDate)}</span>
                  </div>
                  <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">{commitment.text}</p>
                  <Link className="mt-3 inline-flex text-[13px] font-medium text-[var(--accent-bright)]" to={`/entries/${commitment.sourceEntryId}`}>
                    Source entry
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-[14px] leading-6 text-[var(--text-secondary)]">
                Track a next step from the queue or from an entry detail view.
              </p>
            )}
          </div>
        </section>
      </aside>
    </main>
  );
}
