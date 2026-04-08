import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { PromptCard } from '../components/entry/PromptCard';
import { TagGroupField } from '../components/entry/TagGroupField';
import { DOMAIN_TAGS, ENTRY_BLUEPRINTS, STATE_TAGS, isEntryType } from '../config/prompts';
import type { DraftEntry } from '../types/ledger';

function toggleValue(values: string[], target: string) {
  return values.includes(target) ? values.filter((value) => value !== target) : [...values, target];
}

export function EntryFlowPage() {
  const { entryId, type: typeParam } = useParams();
  const navigate = useNavigate();
  const { commitDraft, createDraftForType, data, discardDraft, getEntry, saveDraft } = useLedger();
  const seedEntry = entryId ? getEntry(entryId) : undefined;
  const entryType = seedEntry?.type ?? (isEntryType(typeParam) ? typeParam : undefined);
  const routeKey = `${entryType ?? 'unknown'}:${entryId ?? 'new'}`;
  const draftStoreRef = useRef(data.drafts);
  const [draft, setDraft] = useState<DraftEntry | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    draftStoreRef.current = data.drafts;
  }, [data.drafts]);

  useEffect(() => {
    if (!entryType) {
      setDraft(null);
      return;
    }

    const storedDraft = draftStoreRef.current[entryType];

    if (entryId) {
      if (!seedEntry) {
        setDraft(null);
        return;
      }

      setDraft(storedDraft?.entryId === entryId ? storedDraft : createDraftForType(entryType, seedEntry));
      return;
    }

    setDraft(storedDraft && !storedDraft.entryId ? storedDraft : createDraftForType(entryType));
  }, [createDraftForType, entryId, entryType, routeKey, seedEntry]);

  useEffect(() => {
    setFeedback('');
    setError('');
  }, [routeKey]);

  useEffect(() => {
    if (!entryType || !draft || !data.settings.autosave) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      saveDraft(entryType, draft);
      setFeedback('Draft autosaved locally.');
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [data.settings.autosave, draft, entryType, saveDraft]);

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

  const prompts = ENTRY_BLUEPRINTS[entryType].prompts;
  const totalSteps = prompts.length + 1;
  const isReviewStep = draft.currentStep >= prompts.length;
  const currentPrompt = isReviewStep ? null : prompts[draft.currentStep];
  const missingPromptIndex = prompts.findIndex((prompt) => !draft.answers[prompt.key]?.trim());

  const updateDraft = (updater: (current: DraftEntry) => DraftEntry) => {
    setDraft((current) => (current ? updater(current) : current));
  };

  const saveNow = () => {
    saveDraft(entryType, draft);
    setFeedback('Draft saved locally.');
  };

  const discard = () => {
    const confirmed = window.confirm('Discard this draft? Unsaved progress in the current tab will be lost.');
    if (!confirmed) {
      return;
    }

    discardDraft(entryType);
    navigate(entryId ? `/entries/${entryId}` : '/');
  };

  const submit = () => {
    if (!draft.periodLabel.trim()) {
      setError('Add a period label before finishing.');
      updateDraft((current) => ({ ...current, currentStep: prompts.length }));
      return;
    }

    if (missingPromptIndex >= 0) {
      setError('Answer every prompt before finishing the entry.');
      updateDraft((current) => ({ ...current, currentStep: missingPromptIndex }));
      return;
    }

    const entry = commitDraft(entryType, draft);
    navigate(`/entries/${entry.id}`);
  };

  return (
    <main className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TagPill tone="accent">{ENTRY_BLUEPRINTS[entryType].label}</TagPill>
              {entryId ? <TagPill tone="warm">editing</TagPill> : null}
            </div>
            <h2 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-[510] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">
              {entryId ? 'Refine the entry' : `Capture the ${entryType} thread`}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
              {ENTRY_BLUEPRINTS[entryType].intro}
            </p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2 text-[13px] text-[var(--text-secondary)]">
            {isReviewStep ? 'Review and finish' : `Step ${draft.currentStep + 1} of ${totalSteps}`}
          </div>
        </div>
      </section>

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
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Period label</span>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--accent-border)] focus:shadow-focus"
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    periodLabel: event.target.value
                  }))
                }
                value={draft.periodLabel}
              />
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
                  {draft.answers[prompt.key]?.trim() ? ' complete' : ' missing'}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {error ? (
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] text-[var(--danger-ink)]">
          {error}
        </section>
      ) : null}

      {feedback ? (
        <section className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-[13px] text-[var(--accent-bright)]">
          {feedback}
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-panel">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] disabled:opacity-40"
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
              className="rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
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
              className="rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
              onClick={submit}
              type="button"
            >
              {entryId ? 'Save changes' : 'Finish entry'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
            onClick={saveNow}
            type="button"
          >
            Save draft
          </button>
          <button
            className="rounded-md border border-transparent bg-transparent px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:border-[var(--border-subtle)] hover:bg-[var(--panel-quiet)]"
            onClick={discard}
            type="button"
          >
            Discard
          </button>
        </div>
      </section>
    </main>
  );
}
