---
id: TASK-054
title: Web runtime, API client and application shell
execution_status: ready
relevance: current
depends_on: [TASK-053]
supersedes: []
superseded_by: null
---

# TASK-054 — Web runtime, API client and application shell

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `ready` — TASK-053 documentation complete; web shell can start

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-01](../requirements/FR-WEB.md#fr-web-01--web-runtime-api-client-and-application-shell) |
| Acceptance criteria | `AC-WEB-01-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M7 Web client |
| Baseline references | `WDP@1cea2b7:frontend/package.json`, `WDP@1cea2b7:frontend/public/`, `WDP@1cea2b7:frontend/src/index.js`, `WDP@1cea2b7:frontend/src/App.js`, `WDP@1cea2b7:frontend/src/services/api.js`, `WDP@1cea2b7:frontend/src/services/network.config.js` |

## Objective

The React app installs from a lockfile, builds and renders a Vietnamese shell; API and socket origins come from documented environment variables and errors have visible states.

## In scope

- frontend/package.json
- frontend/public/
- frontend/src/index.js
- frontend/src/App.js
- frontend/src/services/api.js
- frontend/src/services/network.config.js
- Associated styles, assets and tests; API contract alignment; observable loading, empty and failure states

## Out of scope

- Unrelated modules
- Schema or business-rule changes outside an explicit task
- Production deployment or live payment execution

## Inputs and dependencies

- plan.md#12. Migration amendment (2026-10-09)
- docs/technical/migration-wdp.md
- docs/technical/gitflow.md
- docs/technical/architecture.md
- TASK-053 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/package.json`
- `frontend/public/`
- `frontend/src/index.js`
- `frontend/src/App.js`
- `frontend/src/services/api.js`
- `frontend/src/services/network.config.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-01-1` (FR-WEB-01) — The React app installs from a lockfile, builds and renders a Vietnamese shell; API and socket origins come from documented environment variables and errors have visible states. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-054/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-054.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
