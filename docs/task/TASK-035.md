---
id: TASK-035
title: Delivery tracking
execution_status: todo
relevance: current
depends_on: [TASK-033]
supersedes: []
superseded_by: null
---

# TASK-035 — Delivery tracking

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-SHIP-01](../requirements/FR-SHIP.md#fr-ship-01--record-shipping-information), [FR-SHIP-02](../requirements/FR-SHIP.md#fr-ship-02--delivery-status-and-tracking-history), [FR-SHIP-03](../requirements/FR-SHIP.md#fr-ship-03--list-all-deliveries) |
| Acceptance criteria | `AC-SHIP-01-1`, `AC-SHIP-02-1`, `AC-SHIP-03-1` |
| Components | `CMP-DELIVERY` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/delivery/` |

## Objective

Order parties record and read shipping progress.

## In scope

- create, update, status, tracking, admin list with correct route order

## Out of scope

- Carrier APIs

## Inputs and dependencies

- plan.md#4.7 Delivery
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-033 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/delivery/`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-SHIP-01-1` (FR-SHIP-01) — Only the order's seller (and moderators or admins for updates) can create or update the single delivery record of an order, with a provider from the allowed list. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-SHIP-02-1` (FR-SHIP-02) — Each status change appends to the tracking history, and delivery data is readable only by the order's parties, moderators and admins. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-SHIP-03-1` (FR-SHIP-03) — GET /api/delivery/all is reachable (declared before /:orderId) and restricted to admins. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-035/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-035.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
