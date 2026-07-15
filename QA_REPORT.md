# The Ledger - QA Report

## Session: 2026-07-16

**Batch:** Finish-entry persistence repair
**Verdict:** PASS_WITH_RISKS

## Defect reproduction

The regression test queued a draft save and commit in the same event. Before the repair, Vitest reported the exact uncaught exception:

```text
Commit failed because the draft could not be saved.
```

The provider depended on a React functional state updater executing before `persist()` returned. A queued update allowed React to defer the commit producer, leaving `committedEntry` unset.

## Repair verification

| Check | Result | Evidence |
|---|---|---|
| Focused provider regression | PASS | 1 test passed after failing with the original implementation |
| Docker lint | PASS | `npm run lint` exited 0 |
| Docker full tests | PASS | 24 tests passed in 12 files |
| Docker production build | PASS | TypeScript, Vite, and PWA generation completed |
| Brave finish-entry smoke | PASS | Saved draft and finish were triggered back-to-back; entry detail opened and localStorage held exactly one entry with no remaining daily draft |
| Diff validation | PASS | `git diff --check` reported no whitespace errors |

## Browser evidence

- Route after finish: `#/entries/<entry-id>?publish=1`
- Stored key: `the-ledger:v2`
- Stored entry count: 1
- Daily draft present: false
- Browser error matching the reported exception: false

## Risks

- `npm audit` reports 19 development-tree advisories: 1 low, 11 moderate, 6 high, and 1 critical. The critical advisory is in the Vitest development toolchain.
- `npm audit --omit=dev` reports two moderate production advisories and no high or critical production advisories.
- No automatic dependency upgrade was attempted because available Vite and Vitest fixes require major-version changes outside this batch.
