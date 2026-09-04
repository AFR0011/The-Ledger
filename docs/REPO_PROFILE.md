# Repository Profile

Profile: **software**

Confidence: **high**
Workflow schema: `agentic-workflow/v2`

The-Ledger is a single-user local-first React/TypeScript PWA. `src/` is the
product authority; `package.json` and `package-lock.json` define the supported
Node/npm build; `README.md` and `docs/` define public scope and operating limits.

## Governance authority

1. `AGENTS.md` — working rules and protected boundaries.
2. `BLUEPRINT.md` — accepted active batch and acceptance criteria.
3. `DEV_STATE.md` — current phase, risks, verdict, and next action.
4. `RISK_REGISTER.md` — unresolved and historical risk evidence.
5. `QA_REPORT.md` and `DEV_LOG.md` — verification and execution history.
6. `docs/REPO_MAP.md`, `docs/PROJECT_STATE.md`, and `docs/RUN_PROTOCOL.md` —
   product map, supported state, and commands.

The repository intentionally uses these mature equivalents instead of a
ceremonial `shared/` workflow directory: README/BLUEPRINT provide context,
DEV_STATE provides status, DEV_LOG/VERSION_LOG provide history, QA/RISK provide
audit/error evidence, and this single-owner batch requires no cooperative lock.

## Generated and protected surfaces

Generated: `node_modules/`, `dist/`, `dev-dist/`, coverage, `*.tsbuildinfo`, and
compiled Vite/Vitest config artifacts.
Protected: existing Git history, v1/v2 backup compatibility, legacy entry/prompt
rendering, unmanaged LifeOS Markdown regions, and real/private user data.
