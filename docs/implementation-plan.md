# Implementation Plan

## Phase 0 — Foundation (this commit)

- Define architecture and folder structure.
- Add prompt configuration and type-safe data model scaffolding.
- Document phased delivery plan and MVP backlog.

## Phase 1 — Core entry loop

1. Implement prompt config (`src/config/prompts.ts`).
2. Build entry wizard shell:
   - Prompt-by-prompt flow
   - Previous/next navigation
   - Required-answer validation on finish
3. Add local storage data layer:
   - `loadAppData`, `saveAppData`
   - draft operations (`saveDraft`, `clearDraft`, `resumeDraft`)
4. Create Home page with:
   - New Daily / Weekly / Monthly actions
   - Resume Draft card when applicable
5. Build history and detail pages.

## Phase 2 — Continuity + retrieval

1. Add Current Trajectory derivation and card.
2. Add search (headline + answers).
3. Add filters (type, domain tag, state tag).
4. Add JSON export/import with validation and error handling.

## Phase 3 — Quality and polish

1. Improve mobile ergonomics and accessibility.
2. Add migration/versioning strategy for local data.
3. Optional PWA and installability improvements.
4. QoL enhancements from real usage.

## Engineering decisions

- Keep data local-only (`localStorage`) for privacy and simplicity.
- Use config-driven prompts so wording evolves without UI rewrites.
- Keep component boundaries shallow and maintainable.
- Prefer resilient defaults over heavy state libraries in early MVP.

## Risks and mitigations

- **Risk:** localStorage quota or unavailability.
  - **Mitigation:** fail gracefully and surface clear warning UI.
- **Risk:** data corruption on import.
  - **Mitigation:** strict schema validation + confirmation before overwrite.
- **Risk:** over-complex UX.
  - **Mitigation:** one-prompt-at-a-time flow, minimal visual clutter.
