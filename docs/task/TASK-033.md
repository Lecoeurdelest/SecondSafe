---
id: TASK-033
title: Order fulfilment and cancellation
execution_status: todo
relevance: current
depends_on: [TASK-025, TASK-032]
supersedes: []
superseded_by: null
---

# TASK-033 — Order fulfilment and cancellation

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-07](../requirements/FR-ORD.md#fr-ord-07--seller-ships-an-order), [FR-ORD-08](../requirements/FR-ORD.md#fr-ord-08--seller-confirms-delivery), [FR-ORD-09](../requirements/FR-ORD.md#fr-ord-09--buyer-confirms-receipt), [FR-ORD-10](../requirements/FR-ORD.md#fr-ord-10--buyer-cancels-an-order), [NFR-REL-01](../requirements/NFR.md#nfr-rel-01--atomic-money-and-order-changes) |
| Acceptance criteria | `AC-ORD-07-1`, `AC-ORD-07-2`, `AC-ORD-08-1`, `AC-ORD-09-1`, `AC-ORD-09-2`, `AC-ORD-10-1`, `AC-ORD-10-2`, `AC-NFR-REL-01-3` |
| Components | `CMP-ORDERS` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

Orders move through shipping, delivery, receipt and cancellation with correct money effects.

## In scope

- ship, deliver, confirm-receipt, cancel

## Out of scope

- Delivery provider integration

## Inputs and dependencies

- plan.md#4.5 Orders
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-025 evidence
- TASK-032 evidence

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

- [ ] `AC-ORD-07-1` (FR-ORD-07) — Only the seller can move paid to shipped, and recipient name, phone and address are required. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-07-2` (FR-ORD-07) — The tracking number is taken from the request or generated as <PROVIDER>-<order suffix>-<random>. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-08-1` (FR-ORD-08) — Only the seller can move shipped to delivered, and deliveredAt is recorded. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-09-1` (FR-ORD-09) — Only the buyer can move delivered to completed. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-09-2` (FR-ORD-09) — Completion releases escrow to the seller minus the platform fee, marks the listing sold and notifies the seller in one transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-10-1` (FR-ORD-10) — The buyer can cancel only in awaiting_seller_confirmation, awaiting_payment or paid; other states return 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-10-2` (FR-ORD-10) — Cancelling a paid order refunds totalToPay to the buyer wallet; every cancellation returns the listing to active and notifies the seller. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-01-3` (NFR-REL-01) — Fulfilment and cancellation update order, listing and escrow in one transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-033/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-033.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
