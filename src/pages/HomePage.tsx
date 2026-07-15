import { Link } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { TagPill } from '../components/common/TagPill';
import { ENTRY_BLUEPRINTS, ENTRY_TYPES } from '../config/prompts';
import { buildEntrySummary } from '../services/ledgerRepository';
import { formatDisplayDate, formatMissedDays } from '../utils/date';

export function HomePage() {
  const { data } = useLedger();
  const latestEntry = data.entries[0];
  const recentEntries = data.entries.slice(0, 4);
  const draftTypes = ENTRY_TYPES.filter((type) => data.drafts[type]);

  const getDraftHref = (type: (typeof ENTRY_TYPES)[number]) => {
    const draft = data.drafts[type];
    return draft?.entryId ? `/entries/${draft.entryId}/edit` : `/entry/${type}`;
  };

  return (
    <main className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Current posture</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(2rem,3vw,3.5rem)] font-[510] leading-[0.98] tracking-[-0.045em] text-[var(--ink)]">
            {data.currentTrajectory.lastNextStep || 'Start a fresh entry to recover your next right step.'}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
            {latestEntry
              ? `Last entry: ${latestEntry.periodLabel}. ${data.currentTrajectory.reentryMessage}`
              : 'No entries yet. Begin with a daily check-in and let the ledger build continuity from there.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {(['daily', 'monthly'] as const).map((type) => (
              <Link key={type} className="inline-flex min-w-36 items-center justify-center rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]" to={getDraftHref(type)}>
                {data.drafts[type] ? `Resume ${ENTRY_BLUEPRINTS[type].label}` : `New ${ENTRY_BLUEPRINTS[type].label}`}
              </Link>
            ))}
            <a
              className="inline-flex min-w-36 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              href={`${data.settings.contextOsUrl.replace(/\/+$/u, '')}/reviews`}
              rel="noreferrer"
              target="_blank"
            >
              Weekly in ContextOS
            </a>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Trajectory</p>
              <h3 className="mt-3 text-[24px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Carry the live thread forward</h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {data.currentTrajectory.lastWeeklyEntryId ? (
                <Link
                  className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink)]"
                  to={`/entries/${data.currentTrajectory.lastWeeklyEntryId}`}
                >
                  Latest weekly review
                </Link>
              ) : null}
              <TagPill tone="accent">{data.insights.nextStepConsistency}</TagPill>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Last known priorities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.currentTrajectory.lastKnownPriorities.length > 0 ? (
                  data.currentTrajectory.lastKnownPriorities.map((priority) => (
                    <TagPill key={priority} tone="accent">
                      {priority}
                    </TagPill>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[var(--text-secondary)]">The first finished entry will seed this card.</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Weekly signal</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                  {data.currentTrajectory.lastWeeklySignal || 'No weekly review yet. The first weekly entry will compress the broader signal.'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Live thread</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                  {data.currentTrajectory.lastCurrentThread || 'No current thread has been named yet.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Re-entry note</p>
                <TagPill>{formatMissedDays(data.currentTrajectory.missedDays)}</TagPill>
              </div>
              <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                {data.currentTrajectory.reentryMessage}
              </p>
            </div>
          </div>
        </article>
      </section>

      {draftTypes.length > 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Resume drafts</p>
              <h2 className="mt-3 text-[24px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Work already in motion</h2>
            </div>
            <Link className="text-[13px] font-medium text-[var(--accent-bright)]" to="/entries">
              Open full history
            </Link>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {draftTypes.map((type) => {
              const draft = data.drafts[type];
              if (!draft) {
                return null;
              }

              return (
                <Link
                  key={type}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4 hover:border-[var(--border)] hover:bg-[var(--panel-strong)]"
                  to={getDraftHref(type)}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                    {ENTRY_BLUEPRINTS[type].label}
                  </p>
                  <h3 className="mt-3 text-[17px] font-[510] text-[var(--ink)]">{draft.periodLabel}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                    Step {Math.min(draft.currentStep + 1, ENTRY_BLUEPRINTS[type].prompts.length + 1)} saved locally.
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Local insights</p>
              <h2 className="mt-3 text-[24px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Pattern signals</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <TagPill tone="accent">{data.insights.nextStepConsistency}</TagPill>
              <TagPill tone="warm">{`${data.insights.wins.length} wins`}</TagPill>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Suggested focus</p>
              <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                {data.insights.suggestedFocus || 'Finish a few entries and the ledger will synthesize the strongest next focus.'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Recurring domains</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.insights.recurringDomains.length > 0 ? (
                  data.insights.recurringDomains.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))
                ) : (
                  <p className="text-[14px] leading-6 text-[var(--text-secondary)]">
                    Domain patterns appear once the same areas show up repeatedly across recent entries.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Wins</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                {data.insights.wins.length > 0 ? (
                  data.insights.wins.map((win) => <li key={win}>{win}</li>)
                ) : (
                  <li>Add a few entries and tagged wins will appear here.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Bottlenecks</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                {data.insights.bottlenecks.length > 0 ? (
                  data.insights.bottlenecks.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No recurring bottlenecks have been detected yet.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Drift signals</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                {data.insights.driftSignals.length > 0 ? (
                  data.insights.driftSignals.map((signal) => <li key={signal}>{signal}</li>)
                ) : (
                  <li>No active drift signal has been detected from the recent ledger.</li>
                )}
              </ul>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Recent entries</p>
              <h2 className="mt-3 text-[24px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Fast re-entry context</h2>
            </div>
            <Link className="text-[13px] font-medium text-[var(--accent-bright)]" to="/entries">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <Link
                  key={entry.id}
                  className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] p-4 hover:border-[var(--border)] hover:bg-[var(--panel-strong)]"
                  to={`/entries/${entry.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <TagPill tone="accent">{entry.type}</TagPill>
                    <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(entry.date)}</span>
                  </div>
                  <h3 className="mt-3 text-[17px] font-[510] text-[var(--ink)]">{entry.headline || entry.periodLabel}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{buildEntrySummary(entry)}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--panel-quiet)] p-5 text-[14px] leading-6 text-[var(--text-secondary)]">
                The ledger is empty. Create your first daily entry and this space will become your re-entry map.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
