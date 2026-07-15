# The Ledger

The Ledger is a private, offline-first journal for daily entries and monthly reviews. It keeps drafts and history in the browser, publishes durable Markdown to LifeOS, and sends editable proposals to ContextOS or SocialOS only after approval.

## Current product scope

- Versioned daily and monthly prompts with an optional freeform reflection
- Historical weekly entries retained read-only; new weekly reviews open ContextOS `/reviews`
- Local-calendar dates, one canonical entry per day/month, and explicit legacy duplicates
- Seven LifeOS area tags plus the operational `life-admin` tag
- Local draft autosave, history, search, deterministic insights, and PWA support
- JSON backup schema v2 with v1 import compatibility
- LifeOS publishing through a connected folder or Markdown/ZIP downloads
- Managed Markdown regions that preserve user and agent additions on republish
- Proposal-first `lifeos-handoff/v1` links for ContextOS and SocialOS

## Ownership boundaries

- The Ledger authors daily journals and monthly reviews.
- LifeOS owns their durable Markdown canon.
- ContextOS owns weekly reviews, tasks, execution, and proposal triage.
- SocialOS owns people-specific records.
- Folder handles stay in IndexedDB and are never included in Ledger backups.

## Stack and verification

React 18, TypeScript, Vite, Tailwind CSS, local browser storage, Vitest, and `vite-plugin-pwa`.

```powershell
pnpm run lint
pnpm run test
pnpm run build
```

See [Project State](./docs/PROJECT_STATE.md), [Architecture](./docs/architecture.md), [Repo Map](./docs/REPO_MAP.md), [Run Protocol](./docs/RUN_PROTOCOL.md), and [Design](./docs/DESIGN.md).
