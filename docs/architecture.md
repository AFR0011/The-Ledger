# Architecture

```mermaid
flowchart LR
  UI[The Ledger PWA] -->|expected-byte write| Active[(Local ledger)]
  UI -->|before replace/clear| Recovery[(Bounded recovery vault)]
  UI -->|explicit folder grant| LifeOS[LifeOS Markdown]
  UI -->|validated origin + exact-host confirmation| Handoff[ContextOS / SocialOS preview]
  Active -. storage event .->|freeze on conflict| UI
```

## Frontend and state

- Vite + React 18 + TypeScript with hash routing and a PWA app shell.
- `LedgerProvider` owns live state; repository helpers normalize data and enforce period uniqueness.
- `ledgerStorage.ts` writes schema v2 under `the-ledger:v2`, migrates legacy
  keys, verifies bounded recovery snapshots under `the-ledger:recovery:v1`, and
  compares expected bytes before every write to freeze cross-tab conflicts.
- `backup.ts` emits v2 envelopes and accepts strictly validated v1/v2 imports.
  Provider-level replacement preserves the current normalized ledger first.

## Integration boundary

- `markdownExport.ts` creates canonical daily/monthly Markdown and merges stable managed regions.
- `lifeOsFolder.ts` validates a selected LifeOS root, remembers its handle in IndexedDB, reads only direction context, and supports dry-run/bulk publishing.
- `downloads.ts` supplies single Markdown and ZIP fallback exports.
- `integrationOrigins.ts` accepts normalized HTTPS origins or loopback HTTP only;
  paths, queries, fragments, and embedded credentials are rejected.
- `handoff.ts` validates and encodes `lifeos-handoff/v1` payloads in URL fragments
  only after the destination origin passes that policy.
- ContextOS and SocialOS receive proposals; no target record is created until the user approves its preview.

## Routes

- Home, entry flow, history/detail/edit, handoffs, threads, and settings.
- Weekly creation is an external link to ContextOS; historical weekly detail remains readable.
