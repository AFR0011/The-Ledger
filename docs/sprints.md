# Sprints

## Sprint 1 - Usable Core Loop
- Status: implemented, design-aligned to `docs/DESIGN.md`, automated verification passed, manual browser pass queued
- Subtasks:
  - Completed prompt definitions and tag constants
  - Added router and provider-backed app shell
  - Implemented one-prompt-at-a-time wizard
  - Added draft autosave, resume, and final save
  - Rebuilt Home around quick start, resume, and latest context

## Sprint 2 - Entry Management
- Status: implemented, design-aligned to `docs/DESIGN.md`, automated verification passed
- Subtasks:
  - Added entries list route with empty states
  - Added detail route with prompt/answer rendering
  - Added edit flow seeded from an existing entry
  - Added delete with confirmation
  - Restyled list, detail, and edit surfaces to match the dark-native shell in `docs/DESIGN.md`

## Sprint 3 - Continuity And Retrieval
- Status: implemented, continuity model expanded, automated verification passed
- Subtasks:
  - Added derived trajectory snapshot
  - Surfaced continuity context on Home
  - Added search across headlines, answers, and tags
  - Added type, domain, and state tag filters
  - Added weekly signal, live thread, and re-entry guidance to the derived trajectory model
  - Added active filter chips and a jump-back link to the latest weekly review

## Sprint 4 - Data Resilience
- Status: implemented, stricter backup validation added, automated verification passed
- Subtasks:
  - Added versioned export/import envelope
  - Added import validation and overwrite confirmation
  - Added legacy key migration and storage warning states
  - Added settings page for theme, autosave, and backup actions
  - Replaced browser confirm with a parse-first overwrite confirmation surface in Settings
  - Added corruption cleanup and legacy-migration coverage in the test suite

## Sprint 5 - Mobile Polish And Accessibility
- Status: implemented, automated verification passed, mobile release regression passed
- Subtasks:
  - Replaced placeholder UI with a mobile-first reflection layout
  - Improved spacing, hierarchy, and touch-friendly controls
  - Added consistent empty and error states
  - Added reduced-motion fallback styles
  - Added skip navigation, stronger focus-visible states, and larger mobile tap targets across shared surfaces
  - Replaced browser discard confirmation with an in-app confirmation surface and improved prompt field semantics

## Sprint 6 - PWA And Offline Shell
- Status: implemented, install flow surfaced in-product, automated verification passed, offline regression passed, install acceptance remains browser-dependent
- Subtasks:
  - Added `vite-plugin-pwa`
  - Added manifest and app icons
  - Registered the service worker
  - Documented install and offline verification steps
  - Added install action, offline-ready banner, update banner, and app-shell guidance in Settings

## Sprint 7 - Local Insights And Release Hardening
- Status: implemented, automated verification passed, mobile/offline release regression passed
- Subtasks:
  - Added deterministic local insights and continuity signals
  - Added initial service-level tests
  - Added recurring-domain detection, richer focus/drift surfacing on Home, and entry-level insight context in detail views
  - Expanded regression coverage with dedicated insight tests
  - Closed the seeded mobile/offline release regression against the live dev server: Home, history filtering, detail insight context, theme toggle, backup export/import, offline reopen, and offline edit/save
  - Explicit install-prompt acceptance remains a normal-browser validation step because headless automation cannot reliably force `beforeinstallprompt`
