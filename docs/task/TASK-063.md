---
id: TASK-063
title: Web order lists, payment and fulfilment
execution_status: todo
relevance: current
depends_on: [TASK-062, TASK-032, TASK-033, TASK-034, TASK-035]
supersedes: []
superseded_by: null
---

# TASK-063 — Web order lists, payment and fulfilment

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-10](../requirements/FR-WEB.md#fr-web-10--web-order-lists-payment-and-fulfilment) |
| Acceptance criteria | `AC-WEB-10-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M7 Web client |
| Baseline references | `WDP@1cea2b7:frontend/src/modules/order/Orders.jsx`, `WDP@1cea2b7:frontend/src/modules/order/OrderDetail.jsx`, `WDP@1cea2b7:frontend/src/modules/order/OrderPayment.jsx`, `WDP@1cea2b7:frontend/src/modules/order/ConfirmReceipt.jsx`, `WDP@1cea2b7:frontend/src/modules/order/SellerOrders.jsx`, `WDP@1cea2b7:frontend/src/modules/order/ShipOrder.jsx`, `WDP@1cea2b7:frontend/src/modules/order/SEPayOrderSuccess.jsx`, `WDP@1cea2b7:frontend/src/modules/delivery/`, `WDP@1cea2b7:frontend/src/services/delivery.service.js` |

## Objective

Order parties see only their orders and allowed lifecycle actions; payment results are confirmed through the API; shipping, cancellation and receipt states refresh correctly.

## In scope

- frontend/src/modules/order/Orders.jsx
- frontend/src/modules/order/OrderDetail.jsx
- frontend/src/modules/order/OrderPayment.jsx
- frontend/src/modules/order/ConfirmReceipt.jsx
- frontend/src/modules/order/SellerOrders.jsx
- frontend/src/modules/order/ShipOrder.jsx
- frontend/src/modules/order/SEPayOrderSuccess.jsx
- frontend/src/modules/delivery/
- frontend/src/services/delivery.service.js
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
- TASK-062 evidence
- TASK-032 evidence
- TASK-033 evidence
- TASK-034 evidence
- TASK-035 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/src/modules/order/Orders.jsx`
- `frontend/src/modules/order/OrderDetail.jsx`
- `frontend/src/modules/order/OrderPayment.jsx`
- `frontend/src/modules/order/ConfirmReceipt.jsx`
- `frontend/src/modules/order/SellerOrders.jsx`
- `frontend/src/modules/order/ShipOrder.jsx`
- `frontend/src/modules/order/SEPayOrderSuccess.jsx`
- `frontend/src/modules/delivery/`
- `frontend/src/services/delivery.service.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-10-1` (FR-WEB-10) — Order parties see only their orders and allowed lifecycle actions; payment results are confirmed through the API; shipping, cancellation and receipt states refresh correctly. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-063/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-063.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
