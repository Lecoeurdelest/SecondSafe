---
id: TASK-032
title: Order confirmation and payment
execution_status: todo
relevance: current
depends_on: [TASK-025, TASK-026, TASK-030]
supersedes: []
superseded_by: null
---

# TASK-032 — Order confirmation and payment

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-04](../requirements/FR-ORD.md#fr-ord-04--seller-confirms-an-order), [FR-ORD-05](../requirements/FR-ORD.md#fr-ord-05--pay-an-order-from-the-wallet), [FR-ORD-06](../requirements/FR-ORD.md#fr-ord-06--pay-an-order-through-sepay), [NFR-REL-01](../requirements/NFR.md#nfr-rel-01--atomic-money-and-order-changes) |
| Acceptance criteria | `AC-ORD-04-1`, `AC-ORD-05-1`, `AC-ORD-05-2`, `AC-ORD-05-3`, `AC-ORD-06-1`, `AC-ORD-06-2`, `AC-ORD-06-3`, `AC-NFR-REL-01-2` |
| Components | `CMP-ORDERS`, `CMP-WALLET` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

Sellers confirm orders and buyers pay from the wallet or through SePay into escrow.

## In scope

- confirm, pay, SePay order payment and return

## Out of scope

- Payment window value (D-104)

## Inputs and dependencies

- plan.md#4.5 Orders
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-025 evidence
- TASK-026 evidence
- TASK-030 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/orders/`
- `backend/src/modules/payments/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-ORD-04-1` (FR-ORD-04) — Only the order's seller can move awaiting_seller_confirmation to awaiting_payment, and the payment deadline starts at confirmation. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-05-1` (FR-ORD-05) — Only the buyer can pay, and only an unpaid order awaiting payment. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-05-2` (FR-ORD-05) — Payment debits the buyer wallet by totalToPay and creates the escrow hold in the same transaction; insufficient balance returns 400 with no state change. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-05-3` (FR-ORD-05) — A paid order has status paid and paidAt set. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-06-1` (FR-ORD-06) — Creating a SePay order payment records a pending payment transaction bound to the order. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-06-2` (FR-ORD-06) — A verified payment notification marks the order paid and holds escrow exactly once. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-06-3` (FR-ORD-06) — The return endpoint reports the transaction status. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-01-2` (NFR-REL-01) — Order payment updates the order and escrow in the same transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-032/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-032.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
