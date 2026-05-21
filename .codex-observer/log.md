### Observation 001: Observer workspace should be ignored

**Status:** OPEN  
**Date:** 2026-05-14  
**Type:** agents-md  
**Scope:** repo  
**Target:** .gitignore  
**Trigger:** The repo AGENTS instructions required task-observer activation, which created `.codex-observer/`.  
**Issue:** `.codex-observer/` is not ignored, so following the required workflow dirties `git status`.  
**Suggested improvement:** Add `.codex-observer/` to `.gitignore` if the observation workspace should remain local-only.  
**Evidence:** `git status --short` shows `?? .codex-observer/` after observer initialization.  
**Risk if ignored:** Future task-oriented sessions will repeatedly create or leave untracked observer files.  
**Next action:** discuss with user
