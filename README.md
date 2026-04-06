# Private Ledger

A private, mobile-first operating ledger for daily/weekly/monthly guided reflection.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- `localStorage` (local-only persistence)

## Product intent

Private Ledger helps one user keep continuity and momentum by answering three core questions fast:

1. What moved?
2. What matters now?
3. What do I do next?

## Repository status

This repository currently contains **phase-0 planning + initial project skeleton** for the MVP.

- Product docs and implementation plan are in [`docs/`](./docs).
- Initial front-end architecture and folder structure are in [`src/`](./src).

## Planned MVP scope

- Home screen with re-entry context
- Guided entry flow for daily/weekly/monthly prompts
- Draft autosave + resume from `localStorage`
- Entry history and detail view
- Search and basic filters
- Current trajectory card
- Export/import JSON backup

## Getting started

```bash
npm install
npm run dev
```

## Suggested scripts

- `npm run dev` – local development server
- `npm run build` – production build
- `npm run preview` – preview production build locally
- `npm run lint` – lint checks

## Documentation map

- [Product Blueprint](./docs/product-blueprint.md)
- [Implementation Plan](./docs/implementation-plan.md)
- [Architecture & Folder Structure](./docs/architecture.md)
- [MVP Backlog](./docs/mvp-backlog.md)
