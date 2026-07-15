# The Ledger Blueprint

## Role

The Ledger is the private authoring surface for daily journals and monthly reviews. It is local-first and single-user. LifeOS is the durable Markdown destination; ContextOS owns weekly reviews and execution; SocialOS owns people-specific records.

## Active contract

- Daily and monthly prompts are versioned. Old entries render with their original prompts and unknown answers remain visible.
- Weekly entries are historical and read-only. Starting a weekly review opens ContextOS `/reviews`.
- Entry periods use the user's local calendar. Each day or month has one canonical entry; older duplicates remain explicit legacy records.
- Daily next steps become editable ContextOS handoff candidates, not Ledger tasks.
- Social handoffs require a user-selected excerpt; whole journals are never proposed automatically.
- Every handoff is a preview-first `lifeos-handoff/v1` URL-fragment payload.
- Publishing first saves locally, then writes only Ledger-managed regions to LifeOS. Unmanaged or mismatched files become conflicts.
- Connected-folder publishing reads only the current season and current annual outcomes for optional context.

## Persistence

- App data and backups emit schema v2; backup imports accept v1 and v2.
- Content is stored locally. A connected folder handle is remembered separately in IndexedDB and excluded from backups.
- Markdown fallback supports individual downloads and a bulk ZIP with canonical LifeOS paths.

## Verification

Run lint, unit/component tests, and production build. Browser smoke should cover folder permission, dry run, managed-region republishing, conflict handling, downloads, and handoff previews.
