# Project State

## Snapshot
- Repository renamed to `The-Ledger`.
- The app is now a local-first React/Vite implementation rather than a planning-only scaffold.
- Major flows are implemented: guided entries, history/detail/edit/delete, search/filter, backup import/export, settings, insights, and PWA wiring.
- The visual system is now aligned to `docs/DESIGN.md`, which supersedes earlier visual assumptions in the planning docs.
- Docker-based automated verification has passed: install, lint, test, and build.

## Active Objective
- Run the manual browser pass for Sprint 2 on the design-aligned build: entries list, detail, edit, and delete behavior on the new shell.
- After that, complete the remaining manual checks for mobile viewport and installed/offline PWA behavior.

## Known Risks
- Verification is dependent on the Docker Node workflow because host `npm` is unavailable.
- `docs/DESIGN.md` was added after the first implementation pass, so future UI work should treat it as the controlling visual contract.
- PWA install/offline behavior still needs final manual confirmation after the build completes.
- Drafts remain one-per-entry-type. An edit draft for a given type replaces any unsaved new-entry draft for that same type.

## Next Actions
1. Manually test the Sprint 2 routes on the design-aligned build: `/entries`, `/entries/:id`, and `/entries/:id/edit`.
2. Perform the mobile viewport pass across the updated shell.
3. Install the PWA and confirm offline launch behavior.
4. Update sprint statuses from manual-pending to complete once those checks pass.
