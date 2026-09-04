import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { PromptCard } from '../components/entry/PromptCard';
import { TagGroupField } from '../components/entry/TagGroupField';
import { DOMAIN_TAGS, STATE_TAGS, getEntryBlueprint, isEntryType } from '../config/prompts';
import type { DraftEntry } from '../types/ledger';
import { formatPeriodLabel, getPeriodKey, parseLocalDate } from '../utils/date';
import { loadLifeOsFolder, readDirectionContext, type DirectionContext } from '../services/lifeOsFolder';
import { buildIntegrationUrl, integrationHost } from '../services/integrationOrigins';

function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}

export function EntryFlowPage() {
  const { entryId, type: typeParam } = useParams();
  const navigate = useNavigate();
  const { commitDraft, createDraftForType, data, discardDraft, getEntry, saveDraft, status } = useLedger();
  const seedEntry = entryId ? getEntry(entryId) : undefined;
  const entryType = seedEntry?.type ?? (isEntryType(typeParam) ? typeParam : undefined);
  const routeKey = `${entryType ?? 'unknown'}:${entryId ?? 'new'}`;
  const draftStoreRef = useRef(data.drafts);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [error, setError] = useState('');
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [direction, setDirection] = useState<DirectionContext | null>(null);
  const draftRef = useRef<DraftEntry | null>(null);
  const entryTypeRef = useRef(entryType);
  const autosaveRef = useRef(data.settings.autosave);
  const dirtyRef = useRef(false);
  const allowedHashRef = useRef(window.location.hash);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    entryTypeRef.current = entryType;
    autosaveRef.current = data.settings.autosave;
    dirtyRef.current = isDirty;
  }, [data.settings.autosave, entryType, isDirty]);

  useEffect(() => {
    draftStoreRef.current = data.drafts;
  }, [data.drafts]);

  useEffect(() => {
    if (!entryType) {
      setDraft(null);
      setIsDirty(false);
      return;
    }

    const storedDraft = draftStoreRef.current[entryType];

    if (entryId) {
      if (!seedEntry) {
        setDraft(null);
        return;
      }

      setDraft(storedDraft?.entryId === entryId ? storedDraft : createDraftForType(entryType, seedEntry));
      setIsDirty(false);
      return;
    }

    setDraft(storedDraft && !storedDraft.entryId ? storedDraft : createDraftForType(entryType));
    setIsDirty(false);
  }, [createDraftForType, entryId, entryType, routeKey, seedEntry]);

  useEffect(() => {
    setFeedback(null);
    setError('');
    setConfirmingDiscard(false);
  }, [routeKey]);

  useEffect(() => {
    if (entryType !== 'daily' && entryType !== 'monthly') return;
    void loadLifeOsFolder().then(async (handle) => {
      if (!handle || await handle.queryPermission({ mode: 'read' }) !== 'granted') return;
      setDirection(await readDirectionContext(handle));
    }).catch(() => setDirection(null));
  }, [entryType]);

  useEffect(() => {
    if (!entryType || !draft || !data.settings.autosave || !isDirty) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        saveDraft(entryType, draft);
        dirtyRef.current = false;
        setIsDirty(false);
        setFeedback({ message: 'Draft autosaved locally.', tone: 'success' });
      } catch (saveError) {
        setFeedback({ message: saveError instanceof Error ? saveError.message : status.message, tone: 'error' });
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [data.settings.autosave, draft, entryType, isDirty, saveDraft, status.message]);

  useEffect(() => () => {
    const latestDraft = draftRef.current;
    const latestType = entryTypeRef.current;
    if (!dirtyRef.current || !autosaveRef.current || !latestDraft || !latestType) return;
    try {
      saveDraft(latestType, latestDraft);
      dirtyRef.current = false;
    } catch {
      // The persistent status banner carries the write failure after navigation.
    }
  }, [saveDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      const latestDraft = draftRef.current;
      const latestType = entryTypeRef.current;
      if (autosaveRef.current && latestDraft && latestType) {
        try {
          saveDraft(latestType, latestDraft);
          dirtyRef.current = false;
          return;
        } catch {
          // Fall through to the browser's leave warning.
        }
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  useEffect(() => {
    if (!isDirty || data.settings.autosave) {
      allowedHashRef.current = window.location.hash;
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || !destination.hash.startsWith('#/')) return;
      if (destination.hash === allowedHashRef.current) return;
      event.preventDefault();
      setPendingNavigation(destination.hash.slice(1));
    };

    const handleHashChange = () => {
      if (!dirtyRef.current || autosaveRef.current) return;
      if (window.location.hash === allowedHashRef.current) return;
      const destination = window.location.hash.slice(1);
      const currentUrl = new URL(window.location.href);
      currentUrl.hash = allowedHashRef.current;
      window.history.replaceState(null, '', currentUrl);
      setPendingNavigation(destination);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [data.settings.autosave, isDirty]);

  if (!entryType) {
    return (
      <EmptyState
        title="This entry route is invalid"
        description="Use the Home page or entry history to open a valid daily, weekly, or monthly flow."
        action={
          <Link
            className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            to="/"
          >
            Back home
          </Link>
        }
      />
    );
  }

  if (entryType === 'weekly' && !entryId) {
    return (
      <EmptyState
        title="Weekly reviews now live in ContextOS"
        description="Historical weekly entries remain readable here. New weekly planning and review belong to ContextOS so execution has one canonical home."
        action={
          <a
            className="inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
            href={buildIntegrationUrl(data.settings.contextOsUrl, '/reviews')}
            rel="noreferrer"
            target="_blank"
          >
            Open {integrationHost(data.settings.contextOsUrl)}
          </a>
        }
      />
    );
  }

  if (entryId && !seedEntry && !draft) {
    return (
      <EmptyState
        title="The entry you tried to edit no longer exists"
        description="It may have been deleted or replaced. Choose another entry from the history."
        action={
          <Link
            className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            to="/entries"
          >
            Back to entries
          </Link>
        }
      />
    );
  }

  if (!draft) {
    return null;
  }

  const blueprint = getEntryBlueprint(entryType, draft.promptVersion);
  const prompts = blueprint.prompts;
  const totalSteps = prompts.length + 1;
  const isReviewStep = draft.currentStep >= prompts.length;
  const currentPrompt = isReviewStep ? null : prompts[draft.currentStep];
  const missingPromptIndex = prompts.findIndex((prompt) => prompt.required !== false && !draft.answers[prompt.key]?.trim());

  const updateDraft = (updater: (current: DraftEntry) => DraftEntry) => {
    dirtyRef.current = true;
    setIsDirty(true);
    setDraft((current) => (current ? { ...updater(current), updatedAt: new Date().toISOString() } : current));
  };

  const saveNow = () => {
    try {
      saveDraft(entryType, draft);
      dirtyRef.current = false;
      setIsDirty(false);
      setFeedback({ message: 'Draft saved locally.', tone: 'success' });
    } catch (saveError) {
      setFeedback({ message: saveError instanceof Error ? saveError.message : 'Draft could not be saved.', tone: 'error' });
    }
  };

  const discard = () => {
    dirtyRef.current = false;
    setIsDirty(false);
    discardDraft(entryType);
    navigate(entryId ? `/entries/${entryId}` : '/');
  };

  const submit = () => {
    if (missingPromptIndex >= 0) {
      setError('Answer every required prompt before finishing the entry.');
      updateDraft((current) => ({ ...current, currentStep: missingPromptIndex }));
      return;
    }

    try {
      const entry = commitDraft(entryType, draft);
      dirtyRef.current = false;
      setIsDirty(false);
      navigate(`/entries/${entry.id}?publish=1`);
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'The entry could not be saved.');
    }
  };

  const finishPendingNavigation = (save: boolean) => {
    if (!pendingNavigation) return;
    try {
      if (save) saveDraft(entryType, draft);
      else discardDraft(entryType);
      dirtyRef.current = false;
      setIsDirty(false);
      const destination = pendingNavigation;
      setPendingNavigation(null);
      navigate(destination);
    } catch (navigationError) {
      setFeedback({ message: navigationError instanceof Error ? navigationError.message : 'The draft could not be resolved.', tone: 'error' });
    }
  };

  return (
    <main className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TagPill tone="accent">{blueprint.label}</TagPill>
              {entryId ? <TagPill tone="warm">editing</TagPill> : null}
            </div>
            <h2 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-[510] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">
              {entryId ? 'Refine the entry' : `Capture the ${entryType} thread`}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
              {blueprint.intro}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2 text-[13px] text-[var(--text-secondary)]">
            {isReviewStep ? 'Review and finish' : `Step ${draft.currentStep + 1} of ${totalSteps}`}
          </div>
        </div>
      </section>

      {direction && (direction.currentSeason || direction.annualOutcomes) ? (
        <details className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <summary className="cursor-pointer text-[13px] font-medium text-[var(--accent-bright)]">Direction context from LifeOS</summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div><p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Current Season</p><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-[13px] leading-6 text-[var(--text-secondary)]">{direction.currentSeason || 'Not available.'}</pre></div>
            <div><p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Annual Outcomes</p><pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-[13px] leading-6 text-[var(--text-secondary)]">{direction.annualOutcomes || 'Not available.'}</pre></div>
          </div>
        </details>
      ) : null}

      {currentPrompt ? (
        <PromptCard
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              answers: {
                ...current.answers,
                [currentPrompt.key]: value
              }
            }))
          }
          prompt={currentPrompt}
          step={draft.currentStep + 1}
          total={totalSteps}
          value={draft.answers[currentPrompt.key] ?? ''}
        />
      ) : (
        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Review</p>
            <h3 className="mt-3 text-[24px] font-[510] tracking-[-0.03em] text-[var(--ink)]">Finish the entry cleanly</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                {entryType === 'monthly' ? 'Month' : 'Entry date'}
              </span>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--accent-border)] focus:shadow-focus"
                onChange={(event) =>
                  updateDraft((current) => {
                    const date = entryType === 'monthly' ? `${event.target.value}-01` : event.target.value;
                    const parsed = parseLocalDate(date);
                    return { ...current, date, periodKey: getPeriodKey(entryType, parsed), periodLabel: formatPeriodLabel(entryType, parsed) };
                  })
                }
                type={entryType === 'monthly' ? 'month' : 'date'}
                value={entryType === 'monthly' ? draft.date.slice(0, 7) : draft.date}
              />
              <span className="block text-[12px] text-[var(--muted)]">{draft.periodLabel}</span>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Headline</span>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--accent-border)] focus:shadow-focus"
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    headline: event.target.value
                  }))
                }
                placeholder="Optional title for this entry"
                value={draft.headline}
              />
            </label>
          </div>

          <TagGroupField
            description="Mark the domains this entry touches."
            label="Domain tags"
            onToggle={(tag) =>
              updateDraft((current) => ({
                ...current,
                domainTags: toggleValue(current.domainTags, tag)
              }))
            }
            options={DOMAIN_TAGS}
            selected={draft.domainTags}
          />

          <TagGroupField
            description="Capture the state signal so search and insights stay useful."
            label="State tags"
            onToggle={(tag) =>
              updateDraft((current) => ({
                ...current,
                stateTags: toggleValue(current.stateTags, tag)
              }))
            }
            options={STATE_TAGS}
            selected={draft.stateTags}
          />

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Prompt check</h4>
            <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[var(--text-secondary)]">
              {prompts.map((prompt) => (
                <li key={prompt.key}>
                  <span className="font-medium text-[var(--ink)]">{prompt.label}</span>
                  {draft.answers[prompt.key]?.trim() ? ' complete' : prompt.required === false ? ' optional' : ' missing'}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {error ? (
        <section
          aria-live="assertive"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger-ink)]"
          role="alert"
        >
          {error}
        </section>
      ) : null}

      {feedback ? (
        <section
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-[13px] ${
            feedback.tone === 'error'
              ? 'border-[var(--border-subtle)] bg-[var(--danger-soft)] text-[var(--danger-ink)]'
              : 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-bright)]'
          }`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </section>
      ) : null}

      {confirmingDiscard ? (
        <section
          aria-labelledby="discard-draft-title"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel)] p-5 shadow-panel"
          role="region"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Discard draft</p>
          <h3 className="mt-3 text-[22px] font-[510] tracking-[-0.03em] text-[var(--ink)]" id="discard-draft-title">
            Remove this in-progress entry from local storage?
          </h3>
          <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
            This clears the saved draft for the current cadence and returns you to the previous surface.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-md border border-[var(--danger-ink)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--danger-ink)]"
              onClick={discard}
              type="button"
            >
              Confirm discard
            </button>
            <button
              className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              onClick={() => setConfirmingDiscard(false)}
              type="button"
            >
              Keep draft
            </button>
          </div>
        </section>
      ) : null}

      {pendingNavigation ? (
        <section aria-labelledby="dirty-navigation-title" className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--warning-soft)] p-5 shadow-panel" role="alertdialog">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Unsaved draft</p>
          <h3 className="mt-3 text-[22px] font-[510] tracking-[-0.03em] text-[var(--ink)]" id="dirty-navigation-title">Save or discard before leaving?</h3>
          <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">Autosave is off. Choose what happens to the latest edits before navigation continues.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" onClick={() => finishPendingNavigation(true)} type="button">Save and leave</button>
            <button className="min-h-11 rounded-md border border-[var(--danger-ink)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--danger-ink)]" onClick={() => finishPendingNavigation(false)} type="button">Discard and leave</button>
            <button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]" onClick={() => setPendingNavigation(null)} type="button">Stay here</button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-panel">
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] disabled:opacity-40"
            onClick={() =>
              updateDraft((current) => ({
                ...current,
                currentStep: Math.max(current.currentStep - 1, 0)
              }))
            }
            disabled={draft.currentStep === 0}
            type="button"
          >
            Previous
          </button>

          {!isReviewStep ? (
            <button
              className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
              onClick={() =>
                updateDraft((current) => ({
                  ...current,
                  currentStep: Math.min(current.currentStep + 1, prompts.length)
                }))
              }
              type="button"
            >
              {draft.currentStep === prompts.length - 1 ? 'Review' : 'Next'}
            </button>
          ) : (
            <button
              className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
              onClick={submit}
              type="button"
            >
              {entryId ? 'Save changes' : 'Finish entry'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
            onClick={saveNow}
            type="button"
          >
            Save draft
          </button>
          <button
            className="min-h-11 rounded-md border border-transparent bg-transparent px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:border-[var(--border-subtle)] hover:bg-[var(--panel-quiet)]"
            onClick={() => setConfirmingDiscard(true)}
            type="button"
          >
            Discard
          </button>
        </div>
      </section>
    </main>
  );
}
