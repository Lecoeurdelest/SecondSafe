---
id: TASK-039
title: Moderator dashboard and revenue report
execution_status: todo
relevance: current
depends_on: [TASK-004, TASK-005, TASK-033]
supersedes: []
superseded_by: null
---

# TASK-039 — Moderator dashboard and revenue report

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-12](../requirements/FR-ORD.md#fr-ord-12--platform-fee), [FR-MOD-01](../requirements/FR-MOD.md#fr-mod-01--moderator-dashboard), [FR-MOD-08](../requirements/FR-MOD.md#fr-mod-08--revenue-report) |
| Acceptance criteria | `AC-ORD-12-2`, `AC-MOD-01-1`, `AC-MOD-08-1` |
| Components | `CMP-MODERATION` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Moderators see their workload and admins see platform revenue.

## In scope

- dashboard, revenue-report

## Out of scope

- Charts

## Inputs and dependencies

- plan.md#4.5 Orders
- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-004 evidence
- TASK-005 evidence
- TASK-033 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-ORD-12-2` (FR-ORD-12) — The revenue report computes fees from the same configuration source. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-01-1` (FR-MOD-01) — The dashboard returns counts of pending and reviewing reports, pending withdrawals, unreviewed reviews, open orders, suspended users and open disputes, plus the five latest reports. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-08-1` (FR-MOD-08) — The revenue report covers a date range (default the last 12 months), grouped by month over completed orders. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-039/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-039.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
