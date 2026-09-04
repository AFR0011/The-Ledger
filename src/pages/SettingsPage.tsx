import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLedger } from '../app/LedgerProvider';
import { usePwa } from '../app/usePwa';
import type { ImportEnvelope } from '../types/ledger';
import { parseLedgerImport } from '../services/backup';
import { formatDateTime } from '../utils/date';
import { downloadEntriesZip } from '../services/downloads';
import { integrationHost, normalizeIntegrationOrigin } from '../services/integrationOrigins';
import {
  connectLifeOsFolder,
  disconnectLifeOsFolder,
  loadLifeOsFolder,
  publishAllToLifeOs,
  supportsDirectoryPicker
} from '../services/lifeOsFolder';

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
  const {
    data,
    blockedRawValue,
    discardRecovery,
    exportData,
    quotaWarning,
    recoverySnapshots,
    reloadFromStorage,
    replaceData,
    restoreRecovery,
    status,
    startFreshAfterBlockedRecovery,
    updateAutosave,
    updateIntegrationUrls,
    updatePublication,
    updateTheme
  } = useLedger();
  const { canInstall, installApp, isInstalled, offlineReady, resetAppShell } = usePwa();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; tone: FeedbackTone } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    envelope: ImportEnvelope;
  } | null>(null);
  const [destinationChangeConfirmed, setDestinationChangeConfirmed] = useState(false);
  const [blockedRawDownloaded, setBlockedRawDownloaded] = useState(false);
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [contextOsUrl, setContextOsUrl] = useState(data.settings.contextOsUrl);
  const [socialOsUrl, setSocialOsUrl] = useState(data.settings.socialOsUrl);

  useEffect(() => {
    void loadLifeOsFolder().then(setFolder).catch(() => setFolder(null));
  }, []);

  const connectFolder = async () => {
    try {
      const handle = await connectLifeOsFolder();
      setFolder(handle);
      setFeedback({ message: `Connected ${handle.name}. The folder handle stays on this device and is excluded from backups.`, tone: 'success' });
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not connect LifeOS.', tone: 'error' });
    }
  };

  const runBulkPublish = async (dryRun: boolean) => {
    if (!folder) {
      setFeedback({ message: 'Connect the LifeOS vault before running folder publishing.', tone: 'error' });
      return;
    }
    const outcomes = await publishAllToLifeOs(folder, data.entries, dryRun);
    if (!dryRun) {
      for (const outcome of outcomes) {
        const entry = data.entries.find((item) => item.id === outcome.entryId);
        if (!entry) continue;
        updatePublication(entry.id, outcome.status === 'created' || outcome.status === 'updated'
          ? { status: 'synced', path: outcome.path, lastPublishedAt: new Date().toISOString(), publishedSourceUpdatedAt: entry.updatedAt }
          : { status: 'conflict', path: outcome.path, message: outcome.message });
      }
    }
    const counts = outcomes.reduce<Record<string, number>>((result, outcome) => ({ ...result, [outcome.status]: (result[outcome.status] ?? 0) + 1 }), {});
    setFeedback({
      message: `${dryRun ? 'Dry run' : 'Bulk publish'}: ${counts.created ?? 0} created, ${counts.updated ?? 0} updated, ${counts.conflict ?? 0} conflicts, ${counts.failed ?? 0} failed.`,
      tone: counts.failed || counts.conflict ? 'error' : 'success'
    });
  };

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

  const downloadRecovery = (id: string, rawValue: string) => {
    const blob = new Blob([rawValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `the-ledger-recovery-${id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadBlockedRaw = () => {
    if (!blockedRawValue) return;
    downloadRecovery('blocked-active', blockedRawValue);
    setBlockedRawDownloaded(true);
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
      setDestinationChangeConfirmed(false);
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

    try {
      replaceData(pendingImport.envelope.data);
      setFeedback({
        message: `Backup imported from ${pendingImport.fileName}. The prior local ledger is available in Recovery.`,
        tone: 'success'
      });
      setPendingImport(null);
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Import could not be completed safely.', tone: 'error' });
    }
  };

  const destinationChanges = pendingImport
    ? pendingImport.envelope.data.settings.contextOsUrl !== data.settings.contextOsUrl ||
      pendingImport.envelope.data.settings.socialOsUrl !== data.settings.socialOsUrl
    : false;
  const hasStorageWarning = status.state === 'unavailable' || status.state === 'corrupted' || status.state === 'conflicted';

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
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">LifeOS publishing</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Publish daily journals and monthly reviews directly, or download a ZIP with the same vault-relative paths.
          </p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] p-4 text-[14px] text-[var(--text-secondary)]">
            {folder ? `Connected folder: ${folder.name}` : supportsDirectoryPicker() ? 'No LifeOS folder connected.' : 'Folder access is unavailable in this browser; use ZIP downloads.'}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {supportsDirectoryPicker() ? <button className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" onClick={() => void connectFolder()} type="button">{folder ? 'Reconnect folder' : 'Connect LifeOS'}</button> : null}
            {folder ? <><button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={() => void runBulkPublish(true)} type="button">Dry run</button><button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={() => void runBulkPublish(false)} type="button">Publish eligible history</button></> : null}
            <button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={() => downloadEntriesZip(data.entries)} type="button">Download history ZIP</button>
            {folder ? <button className="min-h-11 rounded-md border border-transparent px-4 py-2.5 text-[13px] text-[var(--muted)]" onClick={() => { void disconnectLifeOsFolder(); setFolder(null); }} type="button">Disconnect</button> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">System links</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">These URLs receive approval-gated handoffs. No credentials or journal content are stored in settings.</p>
          <label className="mt-4 block text-[12px] text-[var(--muted)]">ContextOS URL<input className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-3 text-[14px] text-[var(--ink)]" onChange={(event) => setContextOsUrl(event.target.value)} value={contextOsUrl} /></label>
          <label className="mt-4 block text-[12px] text-[var(--muted)]">SocialOS URL<input className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-3 text-[14px] text-[var(--ink)]" onChange={(event) => setSocialOsUrl(event.target.value)} value={socialOsUrl} /></label>
          <button
            className="mt-4 min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
            onClick={() => {
              try {
                const normalizedContext = normalizeIntegrationOrigin(contextOsUrl);
                const normalizedSocial = normalizeIntegrationOrigin(socialOsUrl);
                updateIntegrationUrls(normalizedContext, normalizedSocial);
                setContextOsUrl(normalizedContext);
                setSocialOsUrl(normalizedSocial);
                setFeedback({ message: 'Validated integration origins saved.', tone: 'success' });
              } catch (error) {
                setFeedback({ message: error instanceof Error ? error.message : 'Integration origins are invalid.', tone: 'error' });
              }
            }}
            type="button"
          >
            Save validated origins
          </button>
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
            <button
              className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
              onClick={() => {
                void resetAppShell();
              }}
              type="button"
            >
              Reset cached shell
            </button>
            <p className="text-[13px] leading-6 text-[var(--muted)]">
              Offline launch works after the app shell is cached once while online.
            </p>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[var(--muted)]">
            If a deployed update starts returning `404` for an old `/assets/...` file, reset the cached shell and reload this browser tab.
          </p>
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
          {quotaWarning ? (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--warning-soft)] px-4 py-4 text-[13px] leading-6 text-[var(--warning-ink)]" role="alert">
              {quotaWarning}
            </div>
          ) : null}
          {status.state === 'conflicted' ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={handleExport} type="button">Export this tab</button>
              <button className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white" onClick={reloadFromStorage} type="button">Reload other tab changes</button>
            </div>
          ) : null}
          {status.writeBlocked && blockedRawValue ? (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--danger-soft)] p-4 text-[13px] leading-6 text-[var(--danger-ink)]">
              <p>The unreadable active value is still untouched. Download it before explicitly starting fresh.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px]" onClick={downloadBlockedRaw} type="button">Download untouched raw value</button>
                <button className="min-h-11 rounded-md border border-[var(--danger-ink)] bg-[var(--danger-soft)] px-4 py-2.5 text-[13px] font-medium disabled:opacity-40" disabled={!blockedRawDownloaded} onClick={() => {
                  try {
                    startFreshAfterBlockedRecovery();
                    setFeedback({ message: 'A fresh ledger was created after the raw value was downloaded.', tone: 'success' });
                  } catch (error) {
                    setFeedback({ message: error instanceof Error ? error.message : 'Could not start fresh.', tone: 'error' });
                  }
                }} type="button">Discard active value and start fresh</button>
              </div>
            </div>
          ) : null}
        </article>
      </section>

      {recoverySnapshots.length ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-panel">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Recovery</h3>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">Original bytes are preserved here before corrupt data is cleared and before imports or restores replace local data.</p>
          <ul className="mt-4 space-y-3">
            {recoverySnapshots.map((snapshot) => (
              <li className="rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] p-4" key={snapshot.id}>
                <p className="text-[14px] font-medium text-[var(--ink)]">{snapshot.reason.replace(/-/gu, ' ')}</p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">{formatDateTime(snapshot.capturedAt)} · {snapshot.rawValue.length.toLocaleString()} bytes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="min-h-11 rounded-md border border-[var(--border)] px-3 py-2 text-[13px]" onClick={() => downloadRecovery(snapshot.id, snapshot.rawValue)} type="button">Download raw</button>
                  <button className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-3 py-2 text-[13px] font-medium text-white" onClick={() => {
                    try {
                      restoreRecovery(snapshot.id);
                      setFeedback({ message: 'Recovery restored. The replaced state was preserved as a new recovery snapshot.', tone: 'success' });
                    } catch (error) {
                      setFeedback({ message: error instanceof Error ? error.message : 'This raw snapshot cannot be restored automatically.', tone: 'error' });
                    }
                  }} type="button">Restore</button>
                  <button className="min-h-11 rounded-md border border-transparent px-3 py-2 text-[13px] text-[var(--muted)]" onClick={() => discardRecovery(snapshot.id)} type="button">Discard snapshot</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                The current ledger will first be preserved in Recovery. Confirm only if you want to replace every local entry and draft with the selected backup.
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
              <p>ContextOS: {integrationHost(pendingImport.envelope.data.settings.contextOsUrl)}</p>
              <p>SocialOS: {integrationHost(pendingImport.envelope.data.settings.socialOsUrl)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-4 py-4 text-[14px] leading-6 text-[var(--text-secondary)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Current local data</p>
              <p className="mt-2">Entries: {data.entries.length}</p>
              <p>Drafts: {Object.values(data.drafts).filter(Boolean).length}</p>
              <p>Theme: {data.settings.theme}</p>
              <p>Autosave: {data.settings.autosave ? 'On' : 'Off'}</p>
              <p>ContextOS: {integrationHost(data.settings.contextOsUrl)}</p>
              <p>SocialOS: {integrationHost(data.settings.socialOsUrl)}</p>
            </div>
          </div>

          {destinationChanges ? (
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--warning-soft)] p-4 text-[13px] leading-6 text-[var(--warning-ink)]">
              <input checked={destinationChangeConfirmed} className="mt-1 h-5 w-5" onChange={(event) => setDestinationChangeConfirmed(event.target.checked)} type="checkbox" />
              <span>I reviewed the changed ContextOS/SocialOS hosts and approve them as private handoff destinations.</span>
            </label>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
              disabled={destinationChanges && !destinationChangeConfirmed}
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
