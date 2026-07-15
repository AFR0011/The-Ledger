import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLedger } from '../app/LedgerProvider';
import { EmptyState } from '../components/common/EmptyState';
import { TagPill } from '../components/common/TagPill';
import { getEntryBlueprint } from '../config/prompts';
import { downloadEntryMarkdown } from '../services/downloads';
import { buildHandoffUrl, candidateToHandoff } from '../services/handoff';
import {
  connectLifeOsFolder,
  loadLifeOsFolder,
  publishEntryToLifeOs,
  supportsDirectoryPicker
} from '../services/lifeOsFolder';
import { entryMarkdownPath } from '../services/markdownExport';
import { describeEntryInsightContext } from '../services/insights';
import { formatDateTime, formatDisplayDate } from '../utils/date';

export function EntryDetailPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const {
    createHandoff,
    data,
    deleteEntry,
    getEntry,
    updateHandoffStatus,
    updatePublication
  } = useLedger();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [publishFeedback, setPublishFeedback] = useState('');
  const [contextText, setContextText] = useState('');
  const [socialExcerpt, setSocialExcerpt] = useState('');
  const entry = entryId ? getEntry(entryId) : undefined;
  const existingContextCandidate = data.handoffCandidates.find(
    (candidate) => candidate.sourceEntryId === entryId && candidate.target === 'contextos' && candidate.kind === 'next-action'
  );

  useEffect(() => {
    void loadLifeOsFolder().then(setFolder).catch(() => setFolder(null));
  }, []);

  useEffect(() => {
    setContextText(existingContextCandidate?.body ?? '');
  }, [existingContextCandidate?.body]);

  const blueprint = entry ? getEntryBlueprint(entry.type, entry.promptVersion) : null;
  const unknownAnswers = useMemo(() => {
    if (!entry || !blueprint) return [];
    const known = new Set(blueprint.prompts.map((prompt) => prompt.key));
    return Object.entries(entry.answers).filter(([key, answer]) => !known.has(key) && answer.trim());
  }, [blueprint, entry]);

  if (!entry || !blueprint) {
    return (
      <EmptyState
        title="Entry not found"
        description="This entry may have been deleted or replaced during an import. Return to the full history to pick another entry."
        action={<Link className="inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" to="/entries">Back to entries</Link>}
      />
    );
  }

  const insightContext = describeEntryInsightContext(entry, data.currentTrajectory);
  const canPublish = entry.type !== 'weekly' && !entry.legacyDuplicateOf;

  const publish = async (allowUnmanaged = false) => {
    let activeFolder = folder;
    try {
      if (!activeFolder) {
        activeFolder = await connectLifeOsFolder();
        setFolder(activeFolder);
      }
      const outcome = await publishEntryToLifeOs(activeFolder, entry, allowUnmanaged);
      if (outcome.status === 'created' || outcome.status === 'updated') {
        updatePublication(entry.id, {
          status: 'synced', path: outcome.path, lastPublishedAt: new Date().toISOString(), publishedSourceUpdatedAt: entry.updatedAt
        });
        setPublishFeedback(`Published to ${outcome.path}.`);
      } else {
        updatePublication(entry.id, { status: 'conflict', path: outcome.path, message: outcome.message });
        setPublishFeedback(outcome.message ?? 'Publishing found a conflict.');
      }
    } catch (error) {
      setPublishFeedback(error instanceof Error ? error.message : 'Publishing failed.');
    }
  };

  const download = () => {
    downloadEntryMarkdown(entry);
    updatePublication(entry.id, {
      status: entry.publication?.status === 'synced' ? 'synced' : 'downloaded',
      path: entryMarkdownPath(entry),
      lastDownloadedAt: new Date().toISOString(),
      lastPublishedAt: entry.publication?.lastPublishedAt,
      publishedSourceUpdatedAt: entry.publication?.publishedSourceUpdatedAt
    });
    setPublishFeedback('Markdown downloaded. Ledger cannot verify when a downloaded file is placed in LifeOS.');
  };

  const openHandoff = (target: 'contextos' | 'socialos', body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const candidate = createHandoff(entry.id, {
      target,
      kind: target === 'contextos' ? 'next-action' : 'social-reflection',
      title: entry.headline || `${target === 'contextos' ? 'Next attention' : 'Social reflection'} — ${entry.date}`,
      body: trimmed,
      area: target === 'socialos' ? 'relationships-social' : entry.domainTags[0]
    });
    const baseUrl = target === 'contextos' ? data.settings.contextOsUrl : data.settings.socialOsUrl;
    const route = target === 'contextos' ? '/handoff' : '/capture/handoff';
    window.open(buildHandoffUrl(baseUrl, route, candidateToHandoff(candidate, entry)), '_blank', 'noopener,noreferrer');
    updateHandoffStatus(candidate.id, 'opened');
  };

  return (
    <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <TagPill tone="accent">{entry.type}</TagPill>
                <span className="text-[13px] text-[var(--muted)]">{formatDisplayDate(entry.date)}</span>
                {entry.legacyDuplicateOf ? <TagPill tone="warm">legacy duplicate</TagPill> : null}
                {entry.publication ? <TagPill>{entry.publication.status}</TagPill> : null}
              </div>
              <h2 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-[510] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">{entry.headline || entry.periodLabel}</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">Created {formatDateTime(entry.createdAt)} and updated {formatDateTime(entry.updatedAt)}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]" to={`/entries/${entry.id}/edit`}>Edit entry</Link>
              <button className="min-h-11 rounded-md border border-[var(--border-subtle)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--danger-ink)]" onClick={() => setConfirmingDelete((current) => !current)} type="button">{confirmingDelete ? 'Cancel delete' : 'Delete'}</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {entry.domainTags.map((tag) => <TagPill key={tag}>{tag}</TagPill>)}
            {entry.stateTags.map((tag) => <TagPill key={tag} tone="warm">{tag}</TagPill>)}
          </div>
        </article>

        {confirmingDelete ? (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--danger-soft)] p-5 shadow-panel">
            <h3 className="text-[22px] font-[510] text-[var(--ink)]">Remove this entry from local history?</h3>
            <p className="mt-3 text-[14px] text-[var(--text-secondary)]">This does not delete a Markdown note already published to LifeOS.</p>
            <div className="mt-4 flex gap-3">
              <button className="rounded-md border border-[var(--danger-ink)] px-4 py-2.5 text-[13px] text-[var(--danger-ink)]" onClick={() => { deleteEntry(entry.id); navigate('/entries'); }} type="button">Confirm delete</button>
              <button className="rounded-md border border-[var(--border)] px-4 py-2.5 text-[13px]" onClick={() => setConfirmingDelete(false)} type="button">Keep entry</button>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          {blueprint.prompts.filter((prompt) => entry.answers[prompt.key]?.trim() || prompt.required !== false).map((prompt) => (
            <article key={prompt.key} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{prompt.label}</p>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-secondary)]">{entry.answers[prompt.key] || 'No answer captured for this prompt.'}</p>
            </article>
          ))}
          {unknownAnswers.length ? (
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Legacy responses</p>
              {unknownAnswers.map(([key, answer]) => <div key={key} className="mt-4"><h3 className="capitalize text-[14px] font-medium text-[var(--ink)]">{key.replace(/_/gu, ' ')}</h3><p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-secondary)]">{answer}</p></div>)}
            </article>
          ) : null}
        </section>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">LifeOS publishing</p>
          {canPublish ? (
            <div className="mt-4 space-y-3">
              <p className="text-[13px] leading-5 text-[var(--text-secondary)]">{entryMarkdownPath(entry)}</p>
              {supportsDirectoryPicker() ? <button className="w-full rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" onClick={() => void publish(false)} type="button">{folder ? 'Publish to LifeOS' : 'Connect and publish'}</button> : null}
              <button className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]" onClick={download} type="button">Download Markdown</button>
              {entry.publication?.status === 'conflict' ? <button className="w-full rounded-md border border-[var(--danger-ink)] px-4 py-2.5 text-[13px] text-[var(--danger-ink)]" onClick={() => void publish(true)} type="button">Merge into existing note</button> : null}
              {publishFeedback ? <p aria-live="polite" className="text-[12px] leading-5 text-[var(--text-secondary)]">{publishFeedback}</p> : null}
            </div>
          ) : entry.type === 'weekly' ? (
            <a className="mt-4 inline-flex rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" href={`${data.settings.contextOsUrl.replace(/\/+$/u, '')}/reviews`} rel="noreferrer" target="_blank">Continue in ContextOS</a>
          ) : <p className="mt-4 text-[13px] text-[var(--text-secondary)]">Legacy duplicates require a disambiguated manual download and cannot replace the canonical note.</p>}
        </section>

        {entry.type === 'daily' ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">ContextOS proposal</p>
            <textarea className="mt-4 min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] p-3 text-[14px] text-[var(--ink)]" onChange={(event) => setContextText(event.target.value)} placeholder="An intention or next action to review in ContextOS" value={contextText} />
            <button className="mt-3 w-full rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-40" disabled={!contextText.trim()} onClick={() => openHandoff('contextos', contextText)} type="button">Review in ContextOS</button>
          </section>
        ) : null}

        {entry.domainTags.includes('relationships-social') ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">SocialOS excerpt</p>
            <p className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">Choose or rewrite only the exact relationship context that SocialOS should receive.</p>
            <textarea className="mt-3 min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] p-3 text-[14px] text-[var(--ink)]" onChange={(event) => setSocialExcerpt(event.target.value)} placeholder="Paste a deliberately selected excerpt" value={socialExcerpt} />
            <button className="mt-3 w-full rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-40" disabled={!socialExcerpt.trim()} onClick={() => openHandoff('socialos', socialExcerpt)} type="button">Review in SocialOS</button>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Inspector</p>
          <div className="mt-4 space-y-3 text-[14px] leading-6 text-[var(--text-secondary)]">
            <p>{entry.periodLabel}</p><p>Prompt version {entry.promptVersion}</p>
            {insightContext.length ? <div className="flex flex-wrap gap-2">{insightContext.map((item) => <TagPill key={item}>{item}</TagPill>)}</div> : null}
            {data.commitments.filter((item) => item.sourceEntryId === entry.id).length ? <p>{data.commitments.filter((item) => item.sourceEntryId === entry.id).length} legacy commitment(s), retained read-only.</p> : null}
          </div>
        </section>
      </aside>
    </main>
  );
}
