# Version Log

## Unreleased — local-first trust release

- Approved 2026-09-04 under TL-D1–TL-D12 Option A.
- Preserves the same repository/name and all 16 existing commits.
- Scope: browser-data recovery, import undo, draft-exit safety, destination trust,
  quota/cross-tab visibility, dependency/CI/browser release gates, mobile
  navigation, security headers, truthful documentation, and synthetic visuals.
- Candidate verification: 39 unit/component tests, 10 production-preview browser
  tests, lint/build, and both dependency audits pass under Node 20/npm 10.
- Independent verdict: `PASS_WITH_RISKS`; publication evidence is pending.

## 2026-07-16 — finish-entry persistence repair

- Made provider mutations synchronous against the latest data reference.
- Added regression evidence for immediate Save Draft followed by Finish Entry.
- Retained dependency modernization as a separate risk.
