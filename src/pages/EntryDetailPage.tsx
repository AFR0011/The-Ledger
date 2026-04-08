import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { ENTRY_BLUEPRINTS } from '../config/prompts';
import { formatDateTime, formatDisplayDate } from '../utils/date';

export function EntryDetailPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { deleteEntry, getEntry } = useLedger();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const entry = entryId ? getEntry(entryId) : undefined;

  if (!entry) {
    return (
      <EmptyState
        title="Entry not found"
        description="This entry may have been deleted or replaced during an import. Return to the full history to pick another entry."
        action={
          <Link
            className="inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
            to="/entries"
          >
            Back to entries
          </Link>
        }
      />
    );
  }

  const prompts = ENTRY_BLUEPRINTS[entry.type].prompts;

  return (
    <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="space-y-4">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <TagPill tone="accent">{entry.type}</TagPill>
                <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(entry.date)}</span>
              </div>
              <h2 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-[510] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">
                {entry.headline || entry.periodLabel}
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
                Created {formatDateTime(entry.createdAt)} and updated {formatDateTime(entry.updatedAt)}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] hover:bg-[var(--panel-strong)]"
                to={`/entries/${entry.id}/edit`}
              >
                Edit entry
              </Link>
              <button
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--danger-ink)]"
                onClick={() => setConfirmingDelete((current) => !current)}
                type="button"
              >
                {confirmingDelete ? 'Cancel delete' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {entry.domainTags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
            {entry.stateTags.map((tag) => (
              <TagPill key={tag} tone="warm">
                {tag}
              </TagPill>
            ))}
          </div>
        </article>

        {confirmingDelete ? (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--danger-soft)] p-5 shadow-panel">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--danger-ink)]">Delete confirmation</p>
            <h3 className="mt-3 text-[22px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Remove this entry from local history?</h3>
            <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
              This removes the entry permanently from browser storage. Export a backup first if you may need to recover it later.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-md border border-[var(--danger-ink)] bg-transparent px-4 py-2.5 text-[13px] font-medium text-[var(--danger-ink)]"
                onClick={() => {
                  deleteEntry(entry.id);
                  navigate('/entries');
                }}
                type="button"
              >
                Confirm delete
              </button>
              <button
                className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
                onClick={() => setConfirmingDelete(false)}
                type="button"
              >
                Keep entry
              </button>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          {prompts.map((prompt) => (
            <article key={prompt.key} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{prompt.label}</p>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-secondary)]">
                {entry.answers[prompt.key] || 'No answer captured for this prompt.'}
              </p>
            </article>
          ))}
        </section>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Inspector</p>
          <div className="mt-4 space-y-4 text-[14px] leading-6 text-[var(--text-secondary)]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Period</p>
              <p className="mt-1">{entry.periodLabel}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Type</p>
              <p className="mt-1 capitalize">{entry.type}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Answers captured</p>
              <p className="mt-1">
                {Object.values(entry.answers).filter((answer) => answer.trim()).length} of {prompts.length}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Actions</p>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              className="rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
              to={`/entries/${entry.id}/edit`}
            >
              Edit this entry
            </Link>
            <Link
              className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              to="/entries"
            >
              Back to history
            </Link>
          </div>
        </section>
      </aside>
    </main>
  );
}
