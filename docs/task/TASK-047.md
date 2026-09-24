---
id: TASK-047
title: Listing expiry job
execution_status: blocked
relevance: current
depends_on: [TASK-018]
supersedes: []
superseded_by: null
---

# TASK-047 — Listing expiry job

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-107 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-SYS-04](../requirements/FR-SYS.md#fr-sys-04--expire-old-listings) |
| Acceptance criteria | `AC-SYS-04-1` |
| Components | `CMP-JOBS` |
| Decisions | `D-107` (proposed) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Old listings leave the marketplace according to D-107.

## In scope

- Daily expiry job

## Out of scope

- Seller renewal flow

## Inputs and dependencies

- plan.md#4.13 Scheduled jobs and data operations
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-018 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/services/cron.service.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-SYS-04-1` (FR-SYS-04) — A daily 03:00 job handles active listings older than the configured age (default 30 days) as decided in D-107. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-047/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-047.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- D-107 not accepted

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
