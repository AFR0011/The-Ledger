# Repo Map

## Runtime Shape
- `docs/DESIGN.md`
  - visual source of truth for the app shell, surfaces, type system, and accent usage
- `src/app/`
  - App router plus `LedgerProvider` and `PwaProvider` contexts.
- `src/pages/`
  - Route-level screens: home, entry flow, entries, entry detail, review, threads, settings.
- `src/components/`
  - Shared shell pieces and entry-flow UI primitives.
- `src/config/prompts.ts`
  - Entry definitions, prompt wording, and tag vocabularies.
- `src/services/`
  - `ledgerRepository.ts`: pure CRUD, filtering, normalization, derived state hydration
  - `ledgerStorage.ts`: browser storage load/save, corruption cleanup, and legacy key migration
  - `backup.ts`: strict export/import envelope validation and overwrite-safe parsing
  - `trajectory.ts`: continuity derivation, weekly signal extraction, and re-entry messaging
  - `insights.ts`: deterministic local insight derivation plus entry-level insight-context helpers
  - `reviewQueue.ts`: derived review queue and commitment-candidate helpers
  - `threads.ts`: derived thread grouping across tags and current-thread answers
- `src/pwa.ts`
  - Service worker registration helper shared by the PWA provider.
- `src/utils/`
  - Date formatting and text normalization helpers.

## Primary Data Flow
1. `LedgerProvider` loads the persisted dataset from `localStorage`.
2. Route pages read and mutate state through provider methods.
3. Repository helpers normalize and re-hydrate derived trajectory/insight state after writes.
4. Commitments are persisted in the same app-level JSON object as entries and drafts.
5. Storage service persists the app-level JSON object under `the-ledger:v1`.
6. Backup helpers export/import the full dataset via a versioned envelope.

## Active Surfaces
- `/`
  - Quick start, resume drafts, trajectory, local insights, recent entries
- `/entry/:type`
  - New or resumed daily/weekly/monthly flow
- `/entries`
  - Search/filter list view
- `/entries/:entryId`
  - Detail view with edit/delete actions
- `/entries/:entryId/edit`
  - Edit flow seeded from an existing entry
- `/review`
  - Review queue for commitments, uncommitted next steps, bottlenecks, drift signals, and decisions
- `/threads`
  - Thread view grouped by domain tags, state tags, and named current threads
- `/settings`
  - Theme, autosave, backup import/export, storage status

## Verification-Relevant Files
- `package.json`
- `vite.config.ts`
- `vitest.config.ts`
- `eslint.config.js`
- `src/services/*.test.ts`
