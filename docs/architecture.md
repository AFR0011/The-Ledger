# Architecture

## Frontend and state

- Vite + React 18 + TypeScript with hash routing and a PWA app shell.
- `LedgerProvider` owns live state; repository helpers normalize data and enforce period uniqueness.
- `ledgerStorage.ts` writes schema v2 under `the-ledger:v2` and migrates legacy local keys.
- `backup.ts` emits v2 envelopes and accepts validated v1/v2 imports.

## Integration boundary

- `markdownExport.ts` creates canonical daily/monthly Markdown and merges stable managed regions.
- `lifeOsFolder.ts` validates a selected LifeOS root, remembers its handle in IndexedDB, reads only direction context, and supports dry-run/bulk publishing.
- `downloads.ts` supplies single Markdown and ZIP fallback exports.
- `handoff.ts` validates and encodes `lifeos-handoff/v1` payloads in URL fragments.
- ContextOS and SocialOS receive proposals; no target record is created until the user approves its preview.

## Routes

- Home, entry flow, history/detail/edit, handoffs, threads, and settings.
- Weekly creation is an external link to ContextOS; historical weekly detail remains readable.
