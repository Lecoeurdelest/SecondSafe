---
id: TASK-030
title: Purchase requests and quick buy
execution_status: todo
relevance: current
depends_on: [TASK-006, TASK-010, TASK-016, TASK-018]
supersedes: []
superseded_by: null
---

# TASK-030 — Purchase requests and quick buy

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-01](../requirements/FR-ORD.md#fr-ord-01--send-a-purchase-request), [FR-ORD-02](../requirements/FR-ORD.md#fr-ord-02--quick-buy), [FR-ORD-03](../requirements/FR-ORD.md#fr-ord-03--handle-purchase-requests) |
| Acceptance criteria | `AC-ORD-01-1`, `AC-ORD-01-2`, `AC-ORD-02-1`, `AC-ORD-02-2`, `AC-ORD-03-1`, `AC-ORD-03-2`, `AC-ORD-03-3`, `AC-ORD-03-4` |
| Components | `CMP-ORDERS` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/orders/order.service.js` |

## Objective

Buyers request or quick-buy listings and sellers accept or reject requests.

## In scope

- purchase-request, sent/received lists, accept, reject

## Out of scope

- Chat offers (TASK-031)

## Inputs and dependencies

- plan.md#4.5 Orders
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-006 evidence
- TASK-010 evidence
- TASK-016 evidence
- TASK-018 evidence

## Technical approach

Add an explicit type field (request | quick_buy) to the request payload; no schema change is needed because the order is created directly for quick buy.

## Files and symbols

- `backend/src/modules/orders/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-ORD-01-1` (FR-ORD-01) — A request needs a message (≤500 characters) and a positive price for an active listing the buyer does not own, from an unrestricted seller, by a buyer with phone and address on file. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-01-2` (FR-ORD-01) — A buyer cannot hold two pending requests for the same listing. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-02-1` (FR-ORD-02) — Quick buy is selected by an explicit request type, never by message text. Verify with: static flow review; `cd backend && npm test`.
- [ ] `AC-ORD-02-2` (FR-ORD-02) — Quick buy atomically creates an order awaiting payment with a deadline of the configured payment window, reserves the listing, and notifies the seller. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-03-1` (FR-ORD-03) — Buyers list sent requests and sellers list received requests. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-03-2` (FR-ORD-03) — Only the counterparty can accept or reject a pending request: the unrestricted seller for buyer-initiated requests, the buyer for seller-initiated offers. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-03-3` (FR-ORD-03) — Accepting atomically creates the order and reserves the listing; a buyer-initiated request starts in awaiting_payment, a seller-initiated offer starts in awaiting_seller_confirmation. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-03-4` (FR-ORD-03) — Rejecting stores the reason and notifies the other party. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-030/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-030.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
