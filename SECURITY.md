# Security Policy

The Ledger is a client-only, local-first journal. Entries, drafts, recovery
snapshots, and connected-folder handles must remain on the user's device. The
hosted site has no account system, application database, analytics, or journal
ingestion endpoint.

## Reporting

Please report a vulnerability privately through GitHub's **Report a
vulnerability** flow. Do not include real journal content, backups, browser
storage, folder handles, or handoff fragments in an issue, screenshot, or test.

## Supported release

Only the latest release on `main` is supported. Before reporting a persistence
problem, export a backup and record the browser/version without attaching the
backup itself.

## Trust boundaries

- Browser storage is device/profile-local and is not encrypted by the app.
- Imports replace local data only after a verified recovery snapshot is written.
- Private handoffs use URL fragments, require an exact approved HTTPS origin,
  and still require review in the destination application.
- LifeOS folder access is explicitly granted by the user and its handle is
  excluded from JSON backups.
