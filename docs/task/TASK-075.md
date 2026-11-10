---
id: TASK-075
title: Abandoned checkout tracking and recovery
execution_status: verifying
relevance: current
depends_on: [TASK-010, TASK-032, TASK-046]
supersedes: []
superseded_by: null
---

# TASK-075 — Abandoned checkout tracking and recovery

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Payment reminder, abandonment tracking, cart reminder, reconciliation and the buyer and staff endpoints implemented with unit and real-MongoDB evidence; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-13](../requirements/FR-ORD.md#fr-ord-13--abandoned-checkout-tracking-and-recovery) |
| Acceptance criteria | `AC-ORD-13-1`, `AC-ORD-13-2`, `AC-ORD-13-3`, `AC-ORD-13-4`, `AC-ORD-13-5` |
| Components | `CMP-ORDERS`, `CMP-JOBS` |
| Decisions | `D-001` (accepted), `D-003` (accepted), `D-009` (accepted) |
| Milestone | M9 Checkout recovery |
| Baseline references | — |

## Objective

Unpaid orders and forgotten cart items are tracked as abandoned checkouts; each buyer is reminded once, can resume or buy again, and staff can read how many checkouts were recovered.

## In scope

- New additive collection abandonedcheckouts with its indexes and migration note
- Pre-deadline payment reminder, abandonment record on payment timeout, forgotten-cart reminder, reconciliation
- Buyer list and dismiss endpoints; staff summary and list endpoints
- Reminder lead, cart age and recovery lifetime as business configuration

## Out of scope

- Email or SMS reminders
- Discounts or other incentives to return
- Changes to existing collections

## Inputs and dependencies

- plan.md#4.14 Checkout recovery
- docs/technical/abandoned-checkout.md
- docs/technical/architecture.md
- docs/technical/order-lifecycle.md
- TASK-046 evidence

## Technical approach

Keep one tracking document per order and one per cart item lifetime so every reminder is sent once. Notifications are best effort and never fail an order update. This task is the explicit schema task for the new collection (D-003); it adds no field to an existing schema.

## Files and symbols

- `backend/src/modules/orders/abandoned-checkout.*.js`
- `backend/src/services/cron.service.js`
- `backend/src/services/order-jobs.service.js`
- `backend/src/config/business.js`
- `docs/technical/abandoned-checkout.md`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-ORD-13-1` (FR-ORD-13) — A buyer whose order awaits payment is reminded exactly once when the payment deadline is within the configured lead time (default 60 seconds), and the order is tracked as at risk. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-13-2` (FR-ORD-13) — An order cancelled by the payment timeout is recorded as an open abandoned checkout with a recovery deadline (default 7 days), and the buyer is told the listing is on sale again. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-13-3` (FR-ORD-13) — A cart item older than the configured age (default 24 hours) whose listing is still on sale produces one reminder for as long as the item stays in the cart. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-13-4` (FR-ORD-13) — A tracked checkout becomes recovered when the same buyer pays for the listing, and expired when the recovery deadline passes, the listing stops being available or the cart item is removed. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ORD-13-5` (FR-ORD-13) — A buyer lists and dismisses only their own unfinished checkouts; only moderators and admins read the recovery summary (counts, integer VND amounts and recovery rate by source) and the full list. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-075/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-075.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
