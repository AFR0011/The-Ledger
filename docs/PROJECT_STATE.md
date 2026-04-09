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
- Docker-based automated verification is passing again: lint, test, and build all succeeded through the documented Node 20 container workflow.
- A transient Playwright container now passes the seeded mobile/offline release regression against the live dev server: Home, entries filtering, detail insight context, theme toggle, backup export/import, offline reopen, and offline edit/save.

## Active Objective
- Planned sprint implementation work is complete.
- The only remaining user-side check is explicit install-prompt acceptance in a normal browser session when `beforeinstallprompt` is available.

## Known Risks
- Verification is dependent on the Docker Node workflow because host `npm` is unavailable.
- `docs/DESIGN.md` was added after the first implementation pass, so future UI work should treat it as the controlling visual contract.
- Explicit PWA installation acceptance is still browser-policy dependent and was not forced through headless automation.
- Older deployed tabs can still show `404` errors for stale hashed `/assets/...` files until the browser reloads or the cached shell is reset.
- Drafts remain one-per-entry-type. An edit draft for a given type replaces any unsaved new-entry draft for that same type.

## Next Actions
1. Use a normal interactive browser session to confirm the install prompt appears and can be accepted when supported.
2. If the dev shell looks stale after long-running sessions or PWA-shell changes, restart the `the-ledger-dev` container before debugging UI output.
3. If a deployed session starts requesting deleted asset hashes, use Settings -> `Reset cached shell` or clear site data for that deployment origin before deeper debugging.
4. Keep using the documented Docker verification ladder plus the interactive install check for future release passes.
