# The Ledger Blueprint

## Active batch — Phase 2 local-first trust release

Status: **READY**
Approved: 2026-09-04
Owner: Ali Farrokhnejad
Authority: `outputs/the-ledger-finalization-plan.md` in the portfolio audit
workspace; accepted bundle TL-D1 through TL-D12, all A.

### Objective

Publish a trustworthy same-name local-first portfolio release by preserving
recoverable browser data, preventing dirty-draft loss, validating every private
handoff destination, making quota/cross-tab hazards visible, restoring supported
dependencies and CI/browser gates, fixing mobile navigation and deployment
headers, and presenting only synthetic evidence.

### Intended files

- storage, backup/import, settings, handoff, provider, entry-flow, app-shell,
  types, and their focused tests under `src/`;
- `package.json`, `package-lock.json`, Vite/PWA and test/CI configuration;
- repository governance, README/security/publication evidence, deployment
  header configuration, and synthetic `docs/assets/` visuals.

Allowed adjacent changes are limited to test setup, accessibility labels,
publication guards, and exact destination-route helpers required by a failing
accepted contract.

### Out of scope

No backend, account, cloud sync, analytics, hosted AI, encryption/key management,
multi-device merge, collaborative editing, native rewrite, custom domain,
destination-app feature work, real-user migration, or broad visual redesign.
No history rewrite, squash, force-push, replacement repository, or successor.

### Acceptance criteria

1. Corrupt and pre-import bytes are preserved before destructive replacement;
   preservation failure blocks the overwrite.
2. The latest dirty edit survives immediate navigation/page exit under the
   approved autosave rule; autosave-off navigation requires Save or Discard.
3. Only normalized HTTPS origins (or loopback HTTP in development) can receive
   handoffs; imported changes and exact destination hosts require confirmation.
4. Quota warnings and cross-tab conflicts are visible; conflicted writes freeze
   until the user reloads, exports, or explicitly resolves them.
5. Production audit is clean and no high/critical full-tree advisory remains.
6. Node 20 clean install, lint, tests, build, audit policy, and focused browser
   tests pass in public CI.
7. Navigation fits 320/390/desktop widths and live security headers match docs.
8. README, governance, screenshots, and architecture claims map to evidence.
9. A fresh public clone repeats the gates, all 16 prior commits remain reachable,
   branch deletion follows ancestry proof, and the release tag points to the
   exact verified `main` SHA.

### Verification and required evidence

- focused unit/component tests for every storage/import/draft/destination/conflict
  failure path;
- `npm ci`, lint, full Vitest, TypeScript/PWA build, full and production audits;
- Playwright at 320, 390, and desktop plus recovery/import/navigation/offline
  flows using synthetic data;
- diff hash, `git diff --check`, `git fsck`, current/history credential scans,
  documentation link/asset checks, header read-back, public CI URL, exact SHAs,
  fresh-clone result, ancestry proof, branch/settings/tag/release read-back.

### Risks and rollback

Highest risks are irreversible browser-data loss, destination exfiltration,
dependency-major regressions, and stale service-worker deployments. Preserve
v1/v2 import fixtures and use normal revert commits for any published regression.
Do not delete branches or create the release until all public gates pass.

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

## Completed repair batch — finish-entry persistence

Status: complete on 2026-07-16.

- Objective: finishing an entry must synchronously return the committed entry and persist it before navigation.
- Intended files: `src/app/LedgerProvider.tsx`, a focused provider regression test, and workflow evidence documents.
- Allowed adjacent files: test setup only if the regression cannot be expressed with the existing harness.
- Out of scope: prompt changes, storage schema changes, publishing, handoffs, and general quota UX.
- Acceptance: `commitDraft` no longer throws because React deferred a state updater; the entry is present in provider state and `localStorage`; back-to-back provider mutations use the latest state.
- Verification: focused regression test, full tests, lint, production build, and Brave finish-entry smoke.
- Rollback: restore the provider mutation helper and remove the new regression test.
- Evidence: Docker lint passed; 24 tests passed; production PWA build passed; Brave completed and persisted an entry after back-to-back Save Draft and Finish Entry actions.
