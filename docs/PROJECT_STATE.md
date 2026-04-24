# Project State

## Snapshot
- Repository renamed to `The-Ledger`.
- The app is now a local-first React/Vite implementation rather than a planning-only scaffold.
- Major flows are implemented: guided entries, history/detail/edit/delete, search/filter, backup import/export, settings, insights, and PWA wiring.
- The visual system is now aligned to `docs/DESIGN.md`, which supersedes earlier visual assumptions in the planning docs.
- Sprint 3 continuity has been tightened in code: Home now surfaces weekly signal, live thread, and explicit re-entry guidance from the derived trajectory state.
- Sprint 4 resilience is now stricter in code: malformed backups are rejected instead of being silently normalized, corrupted local snapshots are cleared on load, and import overwrite now uses an explicit in-app confirmation surface.
- Sprint 5 accessibility and mobile-shell polish is in code: skip link, stronger focus-visible treatment, larger tap targets, form semantics, and in-app discard confirmation have been added.
- Sprint 6 PWA behavior is now visible in-product: install support, offline-ready/update banners, and an app-shell section in Settings are wired through a dedicated PWA provider.
- Deployed-shell recovery is now explicit in code: the app reloads on Vite preload failures, refreshes after service-worker controller changes, and Settings exposes a cached-shell reset path for stale bundle 404s.
- Sprint 7 release hardening is now broader in code: insights derive recurring domains, Home surfaces suggested focus and drift signals, and entry detail explains how an entry contributes to the current insight model.
- Post-sprint operating-loop additions are now in code: Review Queue, persisted commitments, and Thread View routes have been added without introducing backend, auth, sync, or external AI dependencies.
- Commitments are now part of the local `the-ledger:v1` dataset and backup envelope. Older local snapshots/imports without commitments normalize to an empty commitments list.
- Host Node fallback verification is passing: lint, test, and build succeeded through `npm.cmd` after `npm.cmd install`. The documented Docker workflow could not run in this session because Docker Desktop's Linux engine was unavailable.
- A transient Playwright container now passes the seeded mobile/offline release regression against the live dev server: Home, entries filtering, detail insight context, theme toggle, backup export/import, offline reopen, and offline edit/save.

## Active Objective
- Planned sprint implementation work is complete.
- Review Queue, Commitments, and Thread View are implemented and need an interactive mobile/browser pass against representative real data.
- Explicit install-prompt acceptance still needs a normal browser session when `beforeinstallprompt` is available.

## Known Risks
- Verification normally uses the Docker Node workflow documented in `docs/RUN_PROTOCOL.md`.
- Docker verification may be blocked if Docker Desktop is not running. `npm.cmd` can be used as a host fallback when PowerShell blocks `npm.ps1`.
- `docs/DESIGN.md` was added after the first implementation pass, so future UI work should treat it as the controlling visual contract.
- Explicit PWA installation acceptance is still browser-policy dependent and was not forced through headless automation.
- Older deployed tabs can still show `404` errors for stale hashed `/assets/...` files until the browser reloads or the cached shell is reset.
- Drafts remain one-per-entry-type. An edit draft for a given type replaces any unsaved new-entry draft for that same type.
- Review Queue and Thread View are deterministic derived views; only commitment status is persisted.

## Next Actions
1. Run an interactive browser pass for `/review` and `/threads` with seeded or real entries: track a next step, mark it done/carried/dropped, and follow a repeated domain/state/current-thread group.
2. Use a normal interactive browser session to confirm the install prompt appears and can be accepted when supported.
3. If the dev shell looks stale after long-running sessions or PWA-shell changes, restart the `the-ledger-dev` container before debugging UI output.
4. If a deployed session starts requesting deleted asset hashes, use Settings -> `Reset cached shell` or clear site data for that deployment origin before deeper debugging.
5. Keep using the documented Docker verification ladder when Docker is available, with `npm.cmd` as the host fallback for local checks.
