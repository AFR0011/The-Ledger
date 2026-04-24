# Architecture

## Frontend
- Vite + React 18 + TypeScript
- Hash-based routing for static/offline friendliness
- Tailwind CSS with CSS-variable theming
- PWA manifest and service worker via `vite-plugin-pwa`

## State And Persistence
- `LedgerProvider` owns the live app state and persistence calls.
- `ledgerRepository.ts` keeps mutations and derived state updates pure.
- `ledgerStorage.ts` persists entries, drafts, commitments, settings, and derived snapshots under `the-ledger:v1`.
- `backup.ts` handles validated full-dataset export/import.

## Derived State
- `trajectory.ts`
  - extracts last priorities, next step, weekly anchor, and missed-day count
- `insights.ts`
  - derives wins, bottlenecks, drift signals, and next-step consistency without external APIs
- `reviewQueue.ts`
  - derives unresolved review items from active commitments and recent entries
- `threads.ts`
  - groups entries into thread summaries from domain tags, state tags, and current-thread answers

## Route Structure
- `HomePage`
- `EntryFlowPage`
- `EntriesPage`
- `EntryDetailPage`
- `ReviewPage`
- `ThreadsPage`
- `SettingsPage`
