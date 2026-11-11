---
task: TASK-075
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-075 — Abandoned checkout tracking and recovery

## What was built

A new collection `abandonedcheckouts` tracks unfinished checkouts. An order awaiting payment is reminded once when its deadline is within the reminder lead time and is tracked as `at_risk`; when the payment timeout cancels it, the checkout becomes `open` and the buyer is told the listing is on sale again. A cart item older than a day whose listing is still on sale is reminded once. A reconciliation job marks a checkout `recovered` when the buyer pays for the listing and `expired` when the offer lapses, the listing is gone or the cart item is removed. Buyers list and dismiss their own checkouts; staff read a summary and the full list. The requirement, both tasks and the plan section are added in the same branch.

## Acceptance criteria

- [x] `AC-ORD-13-1` — observed passing. tests/abandoned-checkout.test.js (one reminder inside the lead time); tests/cron-service.test.js (every 30 seconds); integration section abandoned-checkout.
- [x] `AC-ORD-13-2` — observed passing. tests/abandoned-checkout.test.js and tests/order-jobs.test.js; integration section abandoned-checkout (open checkout, buy-again action, both notifications).
- [x] `AC-ORD-13-3` — observed passing. tests/abandoned-checkout.test.js; integration section abandoned-checkout (fresh item ignored, old item reminded once).
- [x] `AC-ORD-13-4` — observed passing. tests/abandoned-checkout.test.js (recovered, listing gone, cart emptied, lifetime passed); integration section abandoned-checkout (bought again; cart item removed).
- [x] `AC-ORD-13-5` — observed passing. tests/abandoned-checkout.test.js; integration section abandoned-checkout (other buyer sees nothing and cannot dismiss; summary and list refuse users).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 350 tests in 40 suites pass (`.project/evidence/TASK-075/run-01/jest.txt`). |
| Integration | 148 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation, dispute-resolution, withdrawals, jobs, abandoned-checkout (`.project/evidence/TASK-075/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-075/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None from the task specification. The feature is not part of the WDP baseline.

## Known gaps

Reminders are in-app notifications only. The jobs run in the long-lived server process, not on the Vercel serverless deployment. A notification that cannot be delivered is logged and not retried.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-05` | yes | Buyer endpoints filter by the caller; staff endpoints require the staff role (tests and integration) |
| `INV-07` | yes | No order status is changed here; the payment timeout stays in the order job |
| `INV-08` | yes | Amounts are stored as integers and validated by the schema |

## Compatibility and supersession

Additive only: one new collection (run `npm run db:indexes`), four new routes under `/api/abandoned-checkouts`, three optional environment variables. No existing schema changes; see `docs/technical/abandoned-checkout.md`.

## Files changed

- `backend/.env.example`
- `backend/src/config/business.js`
- `backend/src/modules/orders/abandoned-checkout.controller.js`
- `backend/src/modules/orders/abandoned-checkout.model.js`
- `backend/src/modules/orders/abandoned-checkout.route.js`
- `backend/src/modules/orders/abandoned-checkout.service.js`
- `backend/src/routes.js`
- `backend/src/services/cron.service.js`
- `backend/src/services/order-jobs.service.js`
- `backend/tests/abandoned-checkout.test.js`
- `backend/tests/cron-service.test.js`
- `backend/tests/order-jobs.test.js`
- `backend/tests/scaffold.test.js`
- `docs/technical/abandoned-checkout.md`
- `plan.md`
- `project.yaml`
- `tools/pdd/render.py`
- `docs/implement/IMPL-TASK-075.md`
- `.project/evidence/TASK-075/run-01/`
- `.project/state.json and generated views`
