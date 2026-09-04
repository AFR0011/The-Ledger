# The Ledger - Risk Register

## Session: 2026-07-16

### dev-loop cycle initiated

**Date**: 2026-07-16
**Status**: CURRENT

## Registered Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R001 | localStorage quota exceeded causing data loss | Low | High | Add quota detection before saves (Batch 001) |
| R002 | Autosave failures not visible to user | Medium | Medium | Add visible feedback for save status (Batch 001) |
| R003 | Import/export errors not handled gracefully | Low | Medium | Add error handling with user feedback (Batch 001) |
| R004 | Development dependency advisories, including critical Vitest advisory | Low | Medium | Upgrade Vite/Vitest in a separate tested dependency-maintenance batch; do not force major upgrades during a persistence repair |

## Risk Tracking

| Risk | Status |
|------|--------|
| R001 | MITIGATED - quota estimate and write test implemented |
| R002 | MITIGATED - autosave failures surface visible feedback |
| R003 | MITIGATED - import/export paths provide status and error feedback |
| R004 | OPEN - production tree has two moderate advisories and no high or critical advisories |

## Notes
- The finish-entry persistence defect is covered by a provider regression test and Brave smoke.
- Dependency upgrades are deliberately separated because current fixes require major Vite/Vitest versions.

## Phase 2 reassessment — 2026-09-04

Prior mitigation labels do not close the narrower hazards found by the portfolio
audit. R001–R003 are reopened until the active trust batch is tested.

| ID | Current risk | Severity | Status |
| --- | --- | --- | --- |
| R005 | Corrupt current/legacy bytes are deleted before recoverable preservation | Critical | OPEN |
| R006 | Latest debounced edit can be canceled on internal/page exit | High | OPEN |
| R007 | Import has no automatic pre-import recovery or undo | High | OPEN |
| R008 | Imported/arbitrary destination can receive a private handoff fragment | Critical | OPEN |
| R009 | Quota warning is console-only; cross-tab overwrite is undetected | High | OPEN |
| R010 | Production audit has three moderate findings; full tree has high/critical findings | High | OPEN |
| R011 | No public CI/browser gate or static response-header policy | High | OPEN |
| R012 | Mobile Settings navigation is clipped at 390 px | Medium | OPEN |
| R013 | Governance and npm/pnpm/Node instructions contradict actual release state | Medium | OPEN |

R001–R003 status: **REOPENED** pending R005–R009 closure evidence. R004 is
superseded by R010. No risk may be marked mitigated solely by documentation.

## Phase 2 formal TEST — 2026-09-04

| ID | Status | Verification |
| --- | --- | --- |
| R001 | MITIGATED | visible quota warning plus write/read-back and browser tests |
| R002 | MITIGATED | persistence failures and blocked states are visible and tested |
| R003 | MITIGATED | pre-import recovery and error/undo paths are tested |
| R004 | CLOSED | superseded graph upgraded; full audit reports zero findings |
| R005 | MITIGATED | corrupt bytes are preserved; preservation failure blocks overwrite and exposes raw download |
| R006 | MITIGATED | immediate autosave navigation and autosave-off guards pass browser tests |
| R007 | MITIGATED | verified pre-import snapshot plus restore/download/discard UI and tests |
| R008 | MITIGATED | strict origin parser, imported-origin disclosure, and per-handoff confirmation |
| R009 | MITIGATED | quota UI and expected-byte cross-tab freeze covered by tests |
| R010 | CLOSED | production and full dependency audits report zero findings |
| R011 | PARTIAL | workflow and header policy exist; public CI/live read-back remain publication gates |
| R012 | MITIGATED | 320 px, 390 px, and desktop navigation bounds pass Playwright |
| R013 | MITIGATED | Node/npm commands and governance authorities reconciled and tested |

### Accepted residual risks

- **R014 — Browser-local durability (Medium):** no encrypted cloud backup or
  multi-device synchronization. Mitigation: portable backups, recovery vault,
  explicit product documentation.
- **R015 — File System Access portability (Medium):** folder handles and
  permissions depend on the browser/device. Mitigation: validation, dry run,
  downloads, and ZIP fallback.
- **R016 — Concurrent editing semantics (Low/Medium):** conflicts freeze writes
  but are not merged automatically. Mitigation: reload/export/explicit resolution.
