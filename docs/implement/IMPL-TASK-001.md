---
task: TASK-001
execution_status: done
relevance: current
date: 2026-09-24
author: Lecoeurdelest
---

# IMPL-TASK-001 — Scaffold the backend database layer and control framework

## What was built

- **Database layer (carried from WDP@1cea2b7):** all 16 Mongoose schemas, `config/db.js`, `config/env.js`, the chat encryption helper, category and product seeds, `verify-seed-data.js` and `migrate-data-consistency.js`. The schemas and preserved files are byte-identical to the baseline.
- **Script fixes:**
  - Seeds no longer exit the process when imported (DEF-23), so `seed-all` seeds both collections.
  - `create-indexes` covers every model instead of three.
  - `create-admin` takes credentials from `ADMIN_*` variables and enforces the strong password policy (DEF-08).
  - The sample seller password comes from `SEED_SELLER_PASSWORD` instead of a hardcoded value.
- **Empty backend:** every baseline route, controller, service, socket, middleware, utility and cron file exists at its baseline path as a stub. Routers are empty; the other stubs export `{}`. `app.js` and `routes.js` mount all module prefixes and expose `GET /api/health`. `server.js` connects to MongoDB and listens, with no OS-specific code.
- **Tests:** `backend/tests/scaffold.test.js` covers the HTTP shell, model registration, uniqueness indexes, lifecycle enums, required fields, seed conformity and chat encryption round trip.
- **Control framework:**
  - Authored files: `plan.md`, `project.yaml` (136 requirements, 211 criteria, 52 tasks, 17 decisions, 8 invariants, preservation baseline), `.project/state.json`, `.agent/` contract and rules, and the authored technical documents.
  - Generated views, produced by `tools/pdd/render.py`: requirement documents, task index, task specifications and the data model.
  - plan-driven-development is pinned as a submodule at `41c1bd8`.

## Acceptance criteria

- [x] `AC-SYS-06-1` — seed data validates against the schemas; `jest.txt`
- [x] `AC-SYS-06-2` — scripts fail fast without configuration and never print passwords; `scripts.txt`
- [x] `AC-NFR-SEC-02-4` — `create-admin` rejects a weak password; `scripts.txt`
- [x] `AC-NFR-SEC-08-1` — no credentials in the tree, every variable documented, `env.js` fail-fast; `static-scan.txt`, `scripts.txt`
- [x] `AC-NFR-REL-05-1` — unique indexes declared; `jest.txt`
- [x] `AC-NFR-PERF-02-1` — indexes declared per model; `jest.txt`, `docs/technical/data-model.md`
- [x] `AC-NFR-COMP-02-1` — no OS-specific runtime commands; `static-scan.txt`
- [x] `AC-NFR-MNT-01-1` — baseline module file set preserved, logic files stubbed; `structure.txt`
- [x] `AC-NFR-MNT-01-2` — shell boots and `GET /api/health` returns 200; `jest.txt`, `scripts.txt`
- [x] `AC-NFR-MNT-02-1` — dead code not carried; `structure.txt`
- [x] `AC-NFR-MNT-04-1` — README, `.env.example` and documentation map; manual document check
- [x] `AC-NFR-MNT-05-1` — model valid, preservation audit valid, views current, task-status audit valid; `pdd-checks.txt`, `audit-task-status.txt`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-001/run-01/jest.txt`: 9 passed, exit 0 |
| Static analysis | `static-scan.txt`, `structure.txt` in the same run |
| Build/typecheck | `build.txt`: `node --check` on every backend JavaScript file, no failures; the project has no build step |
| Behavioral/manual | `scripts.txt` (script failures and live health check); `pdd-checks.txt`; `audit-task-status.txt`; `report.json` (spec and source hashes, calibration unavailable, confidence `null`) |

## Deviations

- The user chose the "schema + config + seed + index" scope, which includes the migration script. `chat-crypto.util.js` was therefore carried with its logic instead of being stubbed, because the migration imports it.
- The seed seller password moved to `SEED_SELLER_PASSWORD`. `npm run seed` now needs that variable when the seller account does not exist yet.

## Known gaps

- The scripts were not run against a real MongoDB. The sandbox could not download a MongoDB binary. TASK-002 covers this (`AC-SYS-06-3`, `AC-NFR-PERF-02-2`).
- `config/env.js` still falls back to `JWT_SECRET` for chat encryption (baseline, preserved). TASK-022 removes the fallback.
- `Order.isEligibleForAutoRelease` keeps the retired 10-day rule. See `docs/technical/baseline-wdp.md`.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-08` | no | Schemas unchanged; amounts remain numbers validated by the schemas |
| `INV-06` | yes | `create-admin` hashes with bcrypt cost 10 and never prints the password |
| Others | no | No business logic exists yet |

## Compatibility and supersession

- Preserved: schemas, database and env configuration, chat encryption helper, migration and seed-verification scripts (ART-SCHEMAS, ART-DB-CONFIG, ART-ENV-CONFIG, ART-CHAT-CRYPTO, ART-MIGRATE, ART-VERIFY-SEED).
- Enhanced: seeds, seed-all, create-indexes, create-admin, module layout.
- Superseded with approval: baseline business logic (ART-BASELINE-LOGIC → ART-TASK-SPECS).
- Removed with approval: baseline frontend (ART-BASELINE-FRONTEND).

## Files changed

- `backend/**` (package, scripts, `src/`, `tests/`, `.env.example`)
- `plan.md`, `project.yaml`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.gitmodules`
- `.agent/**`, `.project/**`, `docs/**`, `tools/pdd/**`, `tools/plan-driven-development` (submodule)
