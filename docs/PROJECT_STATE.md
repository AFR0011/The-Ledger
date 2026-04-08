# Project State

## Snapshot
- Repository renamed to `The-Ledger`.
- The app is now a local-first React/Vite implementation rather than a planning-only scaffold.
- Major flows are implemented: guided entries, history/detail/edit/delete, search/filter, backup import/export, settings, insights, and PWA wiring.
- The visual system is now aligned to `docs/DESIGN.md`, which supersedes earlier visual assumptions in the planning docs.
- Sprint 3 continuity has been tightened in code: Home now surfaces weekly signal, live thread, and explicit re-entry guidance from the derived trajectory state.
- Sprint 4 resilience is now stricter in code: malformed backups are rejected instead of being silently normalized, corrupted local snapshots are cleared on load, and import overwrite now uses an explicit in-app confirmation surface.
- Docker-based automated verification has passed: install, lint, test, and build.

## Active Objective
- Continue manual browser validation on the design-aligned build, with emphasis on the Settings import/export flow, storage warnings, and the richer Sprint 3 continuity surfaces.
- After that, complete the remaining mobile viewport and installed/offline PWA checks.

## Known Risks
- Verification is dependent on the Docker Node workflow because host `npm` is unavailable.
- `docs/DESIGN.md` was added after the first implementation pass, so future UI work should treat it as the controlling visual contract.
- PWA install/offline behavior still needs final manual confirmation after the build completes.
- Drafts remain one-per-entry-type. An edit draft for a given type replaces any unsaved new-entry draft for that same type.

## Next Actions
1. Manually test Settings export, import preview, overwrite confirm, and storage warning behavior.
2. Manually test Home continuity, latest weekly jump-back, and the history filter chips.
3. Perform the mobile viewport pass across the updated shell.
4. Install the PWA and confirm offline launch behavior.
