# The Ledger

The Ledger is a private, offline-first operating ledger for daily, weekly, and monthly reflection. It keeps continuity local to the browser, surfaces the latest priorities and next step, and lets one user recover context quickly after drift or missed days.

The application shell and interaction styling follow the dark-native system documented in `docs/DESIGN.md`. That file is the visual source of truth for layout density, surfaces, typography, and accent usage.

## Current product scope

- Guided daily, weekly, and monthly entry flows
- Debounced local draft autosave and resume
- Entry history, detail, edit, and delete
- Search and filters across headlines, answers, and tags
- Continuity card and deterministic local insights
- Review queue for unresolved next steps, commitments, bottlenecks, drift, and decisions
- Commitment tracking from finished entries
- Thread view across domains, states, and named current threads
- JSON backup export/import with validation
- Theme controls and local storage status
- PWA installability and offline app shell

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- `localStorage`
- `react-router-dom`
- Vitest + Testing Library
- `vite-plugin-pwa`

## Local run and verification

This machine exposes Node through Docker rather than the host shell.

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm install"
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run dev -- --host 0.0.0.0"
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run lint"
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run test"
docker run --rm -v "${PWD}:/app" -w /app node:20 sh -lc "npm run build"
```

## PWA install and offline notes

- The app now exposes install support in the header and in Settings when the browser raises the install prompt.
- The offline app shell is cached after the first successful online load on the current device and browser profile.
- Installed/offline use keeps the same `localStorage` dataset for that browser profile only. It does not sync across browsers, profiles, or devices.
- If browser storage is cleared, the installed shell can remain while the ledger data is lost. Export backups before browser resets or device changes.

## Repo map

- [Project State](./docs/PROJECT_STATE.md)
- [Design System](./docs/DESIGN.md)
- [Repo Map](./docs/REPO_MAP.md)
- [Run Protocol](./docs/RUN_PROTOCOL.md)
- [Sprints](./docs/sprints.md)
- [Architecture](./docs/architecture.md)
- [Product Blueprint](./docs/product-blueprint.md)
