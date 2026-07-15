# Project State

## Implemented

- Daily prompt v2 and monthly review v2, with prompt-version compatibility for legacy entries
- Historical weekly records retained; new weekly reviews delegated to ContextOS
- Local-period uniqueness, duplicate retention, local-date correction, and deterministic tag migration
- Backup/data schema v2 with v1 import support
- ContextOS and user-selected SocialOS handoff proposals using `lifeos-handoff/v1`
- LifeOS connected-folder publishing, validation, dry run, bulk publishing, downloads, ZIP fallback, managed-region merge, and conflict states
- Read-only LifeOS direction context limited to Current Season and current Annual Outcomes
- PWA dependency and source lint/mojibake issues repaired

## Verification

- Lint passes.
- 23 unit/component tests pass.
- TypeScript and production PWA build pass.

## Remaining browser checks

- Exercise Chromium folder permission persistence and bulk publishing against a disposable LifeOS copy.
- Confirm install-prompt behavior in a normal interactive browser session.
- Confirm target applications accept, preview, and idempotently store the shared handoff fixtures.
