import { useRef, useState, type ChangeEvent } from 'react';
import { useLedger } from '../app/LedgerProvider';
import { exportLedgerData } from '../services/backup';

const THEMES = ['system', 'light', 'dark'] as const;

export function SettingsPage() {
  const { data, importData, status, updateAutosave, updateTheme } = useLedger();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleExport = () => {
    const blob = new Blob([exportLedgerData(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `the-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Backup exported.');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const confirmed = window.confirm('Replace the current ledger with this backup? This will overwrite local entries and drafts.');
    if (!confirmed) {
      event.target.value = '';
      return;
    }

    try {
      const rawText = await file.text();
      importData(rawText);
      setFeedback('Backup imported successfully.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      event.target.value = '';
    }
  };

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
                  'rounded-md border px-4 py-2.5 text-[13px] font-medium transition',
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
              checked={data.settings.autosave}
              className="h-5 w-5 rounded border-[var(--border)] text-[var(--accent)]"
              onChange={(event) => updateAutosave(event.target.checked)}
              type="checkbox"
            />
          </label>
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
              className="rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white"
              onClick={handleExport}
              type="button"
            >
              Export backup
            </button>
            <button
              className="rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
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
        </article>
      </section>

      {feedback ? (
        <section className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-[13px] text-[var(--accent-bright)]">
          {feedback}
        </section>
      ) : null}
    </main>
  );
}
