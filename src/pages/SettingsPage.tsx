import { useRef, useState, type ChangeEvent } from 'react';
import { useLedger } from '../app/LedgerProvider';
import { usePwa } from '../app/usePwa';
import type { ImportEnvelope } from '../types/ledger';
import { parseLedgerImport } from '../services/backup';
import { formatDateTime } from '../utils/date';

const THEMES = ['system', 'light', 'dark'] as const;

type FeedbackTone = 'success' | 'error';

function FeedbackBanner({ message, tone }: { message: string; tone: FeedbackTone }) {
  const toneClass =
    tone === 'success'
      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-bright)]'
      : 'border-[var(--border-subtle)] bg-[var(--danger-soft)] text-[var(--danger-ink)]';

  return (
    <section
      aria-live={tone === 'success' ? 'polite' : 'assertive'}
      className={`rounded-xl border px-4 py-3 text-[13px] ${toneClass}`}
      role={tone === 'success' ? 'status' : 'alert'}
    >
      {message}
    </section>
  );
}

export function SettingsPage() {
  const { data, exportData, replaceData, status, updateAutosave, updateTheme } = useLedger();
  const { canInstall, installApp, isInstalled, offlineReady } = usePwa();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: FeedbackTone } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    envelope: ImportEnvelope;
  } | null>(null);

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `the-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setPendingImport(null);
    setFeedback({ message: 'Backup exported.', tone: 'success' });
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const envelope = parseLedgerImport(rawText);
      setPendingImport({
        fileName: file.name,
        envelope
      });
      setFeedback(null);
    } catch (error) {
      setPendingImport(null);
      setFeedback({
        message: error instanceof Error ? error.message : 'Import failed.',
        tone: 'error'
      });
    } finally {
      event.target.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingImport) {
      return;
    }

    replaceData(pendingImport.envelope.data);
    setFeedback({
      message: `Backup imported from ${pendingImport.fileName}. Local entries and drafts were replaced.`,
      tone: 'success'
    });
    setPendingImport(null);
  };

  const hasStorageWarning = status.state === 'unavailable' || status.state === 'corrupted';

  return (
    <main className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Settings</p>
        <h2 className="mt-3 text-[28px] font-[510] tracking-[-0.04em] text-[var(--ink)]">Local controls</h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
          The Ledger stays local-first. These controls tune the experience, backups, and storage behavior without introducing a server.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Theme</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                className={[
                  'min-h-11 rounded-md border px-4 py-2.5 text-[13px] font-medium transition',
                  data.settings.theme === theme
                    ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-bright)]'
                    : 'border-[var(--border)] bg-[var(--panel-quiet)] text-[var(--ink)] hover:bg-[var(--panel-strong)]'
                ].join(' ')}
                onClick={() => updateTheme(theme)}
                type="button"
              >
                {theme}
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Draft behavior</h3>
          <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4">
            <div>
              <p className="text-[14px] font-medium text-[var(--ink)]">Autosave drafts</p>
              <p className="mt-1 text-[14px] leading-6 text-[var(--text-secondary)]">
                Save every in-progress answer to local storage while you type.
              </p>
            </div>
            <input
              aria-label="Toggle autosave drafts"
              checked={data.settings.autosave}
              className="h-6 w-6 rounded border-[var(--border)] text-[var(--accent)]"
              onChange={(event) => updateAutosave(event.target.checked)}
              type="checkbox"
            />
          </label>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">App shell</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Installability depends on a successful first online load. The installed shell reuses the same browser-local data on this device and profile.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
            <p>Install status: {isInstalled ? 'Installed' : canInstall ? 'Ready to install' : 'Not ready yet'}</p>
            <p>Offline shell: {offlineReady || isInstalled ? 'Cached after first load' : 'Waiting for service worker cache'}</p>
            <p>Data scope: local to this browser profile only</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {canInstall ? (
              <button
                className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
                onClick={() => {
                  void installApp();
                }}
                type="button"
              >
                Install The Ledger
              </button>
            ) : null}
            <p className="text-[13px] leading-6 text-[var(--muted)]">
              Offline launch works after the app shell is cached once while online.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Offline limits</h3>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
            <p>The cached shell lets the app reopen offline, but it does not sync entries between browsers or devices.</p>
            <p className="mt-2">If local storage is cleared, the installed app shell remains but the ledger data does not.</p>
            <p className="mt-2">Export backups before browser resets, profile changes, or device moves.</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Backup</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Export the full local dataset or replace it with a validated The Ledger backup file.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
              onClick={handleExport}
              type="button"
            >
              Export backup
            </button>
            <button
              className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              Import backup
            </button>
            <input accept="application/json" className="hidden" onChange={handleImport} ref={inputRef} type="file" />
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Storage status</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{status.message}</p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
            <p>Entries stored locally: {data.entries.length}</p>
            <p>Drafts in progress: {Object.values(data.drafts).filter(Boolean).length}</p>
            <p>Current data version: {data.appVersion}</p>
          </div>
          {hasStorageWarning ? (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--warning-soft)] px-4 py-4 text-[13px] leading-6 text-[var(--warning-ink)]">
              Export a backup before closing the tab. When storage is unavailable or previously corrupted, the in-memory snapshot is the only safe copy until a successful export.
            </div>
          ) : null}
        </article>
      </section>

      {pendingImport ? (
        <section
          aria-labelledby="confirm-import-title"
          className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel"
          role="region"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Confirm import</p>
              <h3 className="mt-3 text-[22px] font-[510] tracking-[-0.03em] text-[var(--ink)]" id="confirm-import-title">
                Replace the current local ledger
              </h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
                This overwrite is one-way inside the browser. Confirm only if you want to replace every local entry and draft with the selected backup.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Incoming backup</p>
              <p className="mt-2 text-[var(--ink)]">{pendingImport.fileName}</p>
              <p>Exported: {formatDateTime(pendingImport.envelope.exportedAt)}</p>
              <p>Entries: {pendingImport.envelope.data.entries.length}</p>
              <p>Drafts: {Object.values(pendingImport.envelope.data.drafts).filter(Boolean).length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Current local data</p>
              <p className="mt-2">Entries: {data.entries.length}</p>
              <p>Drafts: {Object.values(data.drafts).filter(Boolean).length}</p>
              <p>Theme: {data.settings.theme}</p>
              <p>Autosave: {data.settings.autosave ? 'On' : 'Off'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
              onClick={confirmImport}
              type="button"
            >
              Confirm overwrite import
            </button>
            <button
              className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              onClick={() => setPendingImport(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? <FeedbackBanner message={feedback.message} tone={feedback.tone} /> : null}
    </main>
  );
}
