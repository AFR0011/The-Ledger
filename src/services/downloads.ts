import { strToU8, zipSync } from 'fflate';
import type { LedgerEntry } from '../types/ledger';
import { eligibleEntries, entryMarkdownPath, renderEntryMarkdown } from './markdownExport';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadEntryMarkdown(entry: LedgerEntry) {
  const parts = entryMarkdownPath(entry).split('/');
  const filename = parts[parts.length - 1] ?? `${entry.date}.md`;
  triggerDownload(new Blob([renderEntryMarkdown(entry)], { type: 'text/markdown;charset=utf-8' }), filename);
}

export function downloadEntriesZip(entries: LedgerEntry[]) {
  const files = Object.fromEntries(
    eligibleEntries(entries).map((entry) => [entryMarkdownPath(entry), strToU8(renderEntryMarkdown(entry))])
  );
  const archive = zipSync(files, { level: 6 });
  triggerDownload(new Blob([archive], { type: 'application/zip' }), `the-ledger-lifeos-${new Date().toISOString().slice(0, 10)}.zip`);
}
