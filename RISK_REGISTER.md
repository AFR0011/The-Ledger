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
