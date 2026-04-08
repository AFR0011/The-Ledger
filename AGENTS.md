# The Ledger

## Repo Type
- Offline-first React + TypeScript application built with Vite and Tailwind.
- Single-user local-first product. No backend, auth, sync, or external AI path exists in this repo.

## Source Of Truth
- App behavior: `src/`
- Visual system: `docs/DESIGN.md`
- Product and operating docs: `README.md`, `docs/PROJECT_STATE.md`, `docs/REPO_MAP.md`, `docs/RUN_PROTOCOL.md`, `docs/sprints.md`
- Prompt model and tag vocabulary: `src/config/prompts.ts`
- Persistence contracts and local data rules: `src/types/ledger.ts`, `src/services/ledgerRepository.ts`, `src/services/ledgerStorage.ts`, `src/services/backup.ts`

## Working Rules
- Keep the app offline-first and local-only.
- Prefer small local diffs over structural churn.
- Do not add backend services, auth flows, or hosted dependencies unless explicitly requested.
- Keep prompts config-driven. Avoid duplicating prompt wording in UI code.
- Keep repository logic pure in `src/services/` and keep UI state shallow in React components/provider code.
- Update repo docs when routes, storage rules, verification steps, or sprint status materially change.

## Verification Ladder
1. `docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm install"`
2. `docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run lint"`
3. `docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run test"`
4. `docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run build"`
5. Manual browser pass on a mobile-sized viewport:
   start/resume/finish entries, edit/delete entries, search/filter history, export/import backup, theme toggle, offline/PWA behavior.

## Done Criteria
- The change is reflected in code and docs.
- Lint, tests, and build pass through the Docker Node workflow.
- Any remaining limitation is documented plainly in `docs/PROJECT_STATE.md`.
