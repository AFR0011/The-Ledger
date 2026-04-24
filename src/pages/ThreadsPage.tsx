import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { buildEntrySummary } from '../services/ledgerRepository';
import { deriveThreadSummaries } from '../services/threads';
import { formatDisplayDate } from '../utils/date';

const SOURCE_LABELS = {
  domain: 'domain',
  state: 'state',
  'current-thread': 'thread'
} as const;

export function ThreadsPage() {
  const { data } = useLedger();
  const [searchParams] = useSearchParams();
  const threads = useMemo(() => deriveThreadSummaries(data.entries), [data.entries]);
  const selectedThreadId = searchParams.get('thread') ?? threads[0]?.id;
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];

  if (data.entries.length === 0 || threads.length === 0) {
    return (
      <EmptyState
        title="No threads yet"
        description="Threads appear after entries collect domain tags, state tags, or a named current thread."
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
    <main className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel xl:sticky xl:top-28 xl:self-start">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Thread view</p>
        <h2 className="mt-3 text-[28px] font-[510] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
          Follow themes across entries
        </h2>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
          Threads are grouped from domain tags, state tags, and the current-thread prompt.
        </p>

        <div className="mt-5 space-y-2">
          {threads.map((thread) => {
            const isSelected = thread.id === selectedThread?.id;

            return (
              <Link
                key={thread.id}
                className={[
                  'block rounded-xl border p-4',
                  isSelected
                    ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--panel-quiet)] hover:border-[var(--border)] hover:bg-[var(--panel-strong)]'
                ].join(' ')}
                to={`/threads?thread=${encodeURIComponent(thread.id)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TagPill tone={thread.source === 'domain' ? 'accent' : undefined}>{SOURCE_LABELS[thread.source]}</TagPill>
                  <span className="text-[12px] text-[var(--muted)]">{thread.count} entries</span>
                </div>
                <h3 className="mt-3 text-[16px] font-[510] text-[var(--ink)]">{thread.label}</h3>
                <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">{thread.latestSignal}</p>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="space-y-4">
        {selectedThread ? (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TagPill tone="accent">{SOURCE_LABELS[selectedThread.source]}</TagPill>
                    <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(selectedThread.lastEntryDate)}</span>
                  </div>
                  <h2 className="mt-3 text-[clamp(2rem,3vw,3rem)] font-[510] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">
                    {selectedThread.label}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">{selectedThread.latestSignal}</p>
                </div>
                <TagPill>{`${selectedThread.count} entries`}</TagPill>
              </div>
            </div>

            {selectedThread.entries.map((entry) => (
              <Link
                key={entry.id}
                className="block rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel hover:border-[var(--accent-border)]"
                to={`/entries/${entry.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TagPill tone="accent">{entry.type}</TagPill>
                    <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(entry.date)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.domainTags.slice(0, 2).map((tag) => (
                      <TagPill key={tag}>{tag}</TagPill>
                    ))}
                    {entry.stateTags.slice(0, 1).map((tag) => (
                      <TagPill key={tag} tone="warm">
                        {tag}
                      </TagPill>
                    ))}
                  </div>
                </div>
                <h3 className="mt-4 text-[20px] font-[510] tracking-[-0.02em] text-[var(--ink)]">{entry.headline || entry.periodLabel}</h3>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">{buildEntrySummary(entry)}</p>
              </Link>
            ))}
          </>
        ) : null}
      </section>
    </main>
  );
}
