# Repo Map

- `src/config/prompts.ts`: versioned prompt catalog and LifeOS tag vocabulary
- `src/types/ledger.ts`: schema v2 entries, publication states, handoff candidates, settings
- `src/services/ledgerRepository.ts`: normalization, migrations, uniqueness, and mutations
- `src/services/ledgerStorage.ts`: local persistence and legacy-key migration
- `src/services/backup.ts`: v1/v2 backup compatibility
- `src/services/markdownExport.ts`: canonical paths, YAML, managed regions, and merge safety
- `src/services/lifeOsFolder.ts`: File System Access API, IndexedDB handle, direction reads, dry run, and publishing
- `src/services/downloads.ts`: Markdown and ZIP fallback
- `src/services/handoff.ts`: `lifeos-handoff/v1` validation and base64url transport
- `src/pages/EntryFlowPage.tsx`: daily/monthly authoring and legacy weekly editing
- `src/pages/EntryDetailPage.tsx`: publish/download actions and editable handoff proposals
- `src/pages/SettingsPage.tsx`: integration URLs, folder connection, dry run, bulk export, and backups
- `src/pages/ReviewPage.tsx`: proposal inbox and read-only legacy commitments

Data flows from local edits to local persistence first. Publishing or handoff happens only through an explicit user action afterward.
