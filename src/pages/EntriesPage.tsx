import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { DOMAIN_TAGS, ENTRY_TYPES, STATE_TAGS } from '../config/prompts';
import type { EntryFilters } from '../types/ledger';
import { buildEntrySummary, filterEntries } from '../services/ledgerRepository';
import { formatDisplayDate } from '../utils/date';

const DEFAULT_FILTERS: EntryFilters = {
  query: '',
  type: 'all',
  domainTag: 'all',
  stateTag: 'all'
};

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
      <select
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent-border)] focus:shadow-focus"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EntriesPage() {
  const { data } = useLedger();
  const [filters, setFilters] = useState<EntryFilters>(DEFAULT_FILTERS);
  const deferredQuery = useDeferredValue(filters.query);

  const visibleEntries = useMemo(
    () =>
      filterEntries(data.entries, {
        ...filters,
        query: deferredQuery
      }),
    [data.entries, deferredQuery, filters]
  );

  const activeFilters = useMemo(() => {
    const items: string[] = [];

    if (filters.type !== 'all') {
      items.push(filters.type);
    }

    if (filters.domainTag !== 'all') {
      items.push(filters.domainTag);
    }

    if (filters.stateTag !== 'all') {
      items.push(filters.stateTag);
    }

    if (deferredQuery) {
      items.push(`query: ${deferredQuery}`);
    }

    return items;
  }, [deferredQuery, filters.domainTag, filters.stateTag, filters.type]);

  const updateFilter = <K extends keyof EntryFilters>(key: K, value: EntryFilters[K]) => {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        [key]: value
      }));
    });
  };

  if (data.entries.length === 0) {
    return (
      <EmptyState
        title="No entries yet"
        description="The history surface becomes useful after the first completed entry. Start with a daily check-in and come back when you want search, filters, or editing."
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
    <main className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel xl:sticky xl:top-28 xl:self-start">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Entry management</p>
        <h2 className="mt-3 text-[28px] font-[510] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
          Search, filter, and revisit the ledger
        </h2>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
          Use quick filters to narrow the feed before you edit or review older entries.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Query</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-quiet)] focus:border-[var(--accent-border)] focus:shadow-focus"
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Search headlines, answers, or tags"
              value={filters.query}
            />
          </label>

          <FilterSelect
            label="Entry type"
            onChange={(value) => updateFilter('type', value as EntryFilters['type'])}
            options={[{ label: 'All entry types', value: 'all' }, ...ENTRY_TYPES.map((type) => ({ label: type, value: type }))]}
            value={filters.type}
          />

          <FilterSelect
            label="Domain tag"
            onChange={(value) => updateFilter('domainTag', value)}
            options={[{ label: 'All domains', value: 'all' }, ...DOMAIN_TAGS.map((tag) => ({ label: tag, value: tag }))]}
            value={filters.domainTag}
          />

          <FilterSelect
            label="State tag"
            onChange={(value) => updateFilter('stateTag', value)}
            options={[{ label: 'All state tags', value: 'all' }, ...STATE_TAGS.map((tag) => ({ label: tag, value: tag }))]}
            value={filters.stateTag}
          />

          <button
            className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink)]"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </aside>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-5 py-4 shadow-panel">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Visible feed</p>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              {visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'} match the current query.
            </p>
            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <TagPill key={filter}>{filter}</TagPill>
                ))}
              </div>
            ) : null}
          </div>
          <Link
            className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-medium text-[var(--accent-bright)]"
            to="/entry/daily"
          >
            New entry
          </Link>
        </div>

        {visibleEntries.length > 0 ? (
          visibleEntries.map((entry) => (
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

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <h3 className="text-[20px] font-[510] tracking-[-0.02em] text-[var(--ink)]">{entry.headline || entry.periodLabel}</h3>
                  <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">{buildEntrySummary(entry)}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-4 py-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                  <p>{entry.periodLabel}</p>
                  <p className="mt-1 text-[var(--muted)]">Open to review, edit, or delete.</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            title="No entries match those filters"
            description="Clear the filters or widen the search query to see more of the ledger."
          />
        )}
      </section>
    </main>
  );
}
