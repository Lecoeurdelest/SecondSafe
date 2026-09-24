---
id: TASK-034
title: Order queries
execution_status: todo
relevance: current
depends_on: [TASK-030]
supersedes: []
superseded_by: null
---

# TASK-034 — Order queries

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-11](../requirements/FR-ORD.md#fr-ord-11--order-lists-and-detail) |
| Acceptance criteria | `AC-ORD-11-1`, `AC-ORD-11-2` |
| Components | `CMP-ORDERS` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

Parties list and open their orders.

## In scope

- buying, selling, detail

## Out of scope

- Moderator order lists

## Inputs and dependencies

- plan.md#4.5 Orders
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-030 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/orders/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-ORD-11-1` (FR-ORD-11) — Buying and selling lists filter by status and are paginated. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-11-2` (FR-ORD-11) — Order detail is visible only to the buyer, the seller, moderators and admins. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-034/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-034.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
