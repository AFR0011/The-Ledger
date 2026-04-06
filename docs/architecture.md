# Architecture & Initial Folder Structure

## Frontend architecture

- **Vite + React + TypeScript** for fast iteration and maintainability.
- **Tailwind CSS** for mobile-first utility styling.
- **localStorage-backed data layer** behind service functions.
- **Feature-oriented foldering** with shared app primitives.

## Directory layout

```text
src/
  app/                 # app shell + providers
  components/
    common/            # reusable ui blocks
    entry/             # wizard/prompt-related components
    home/
    history/
    trajectory/
    settings/
  config/              # prompts, tags, constants
  features/
    entry-wizard/
    entries/
    trajectory/
    data-management/
  pages/               # route-level screens
  services/            # storage, import/export, selectors
  store/               # app state management wrappers
  types/               # app-wide type definitions
  utils/               # pure helpers
  styles/              # global styles and tokens
```

## Planned top-level pages

- `HomePage`
- `EntryFlowPage`
- `EntriesPage`
- `EntryDetailPage`
- `SettingsPage`

## Core service boundaries

- `ledgerStorage.ts`
  - low-level localStorage read/write
- `ledgerRepository.ts`
  - CRUD and query semantics for entries + drafts
- `trajectory.ts`
  - derives current trajectory snapshot from stored entries
- `backup.ts`
  - export/import and data version checks

## Data strategy

- Persist one app-level JSON object.
- Keep `appVersion` for forward migrations.
- Keep drafts separate from committed entries.
- Update `updatedAt` on all mutating operations.
