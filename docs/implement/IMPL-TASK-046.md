---
task: TASK-046
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-046 — Order lifecycle jobs

## What was built

`cron.service.js` schedules three jobs when the server starts: every minute unpaid orders past their payment deadline are cancelled and their listing reopened; every hour delivered, undisputed orders past the completion window are completed through escrow, and paid orders not shipped within the shipping window are refunded through escrow. One failing order does not stop a batch, and a job that is still running is not started again. The scheduler uses `setInterval`, so no dependency is added.

## Acceptance criteria

- [x] `AC-SYS-01-1` — observed passing. tests/order-jobs.test.js and tests/cron-service.test.js (every minute); flow-review.md; integration section jobs.
- [x] `AC-SYS-02-1` — observed passing. tests/order-jobs.test.js and tests/cron-service.test.js (hourly, configured window, disputed orders skipped); flow-review.md; integration section jobs (seller paid once; second run releases nothing).
- [x] `AC-SYS-03-1` — observed passing. tests/order-jobs.test.js and tests/cron-service.test.js; flow-review.md; integration section jobs (buyer refunded, order cancelled).
- [ ] `AC-NFR-REL-03-1` — not verified. Per-record isolation is observed (tests/order-jobs.test.js). The lock is an in-process guard (tests/cron-service.test.js): it stops overlapping runs in one server process but not across several instances, which D-108 (proposed) leaves to a later shared store.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 342 tests in 39 suites pass (`.project/evidence/TASK-046/run-01/jest.txt`). |
| Integration | 130 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation, dispute-resolution, withdrawals, jobs (`.project/evidence/TASK-046/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-046/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-046/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline used node-cron. Windows come from the business configuration; the baseline hard-coded 5 days and 24 hours, and the order service hard-coded the 3-minute payment window (now `PAYMENT_WINDOW_MS`). The seller is told when a timeout cancels an order.

## Known gaps

The lock is per process (see AC-NFR-REL-03-1). The jobs run only in the long-lived server (`src/server.js`); the Vercel serverless entry never starts them. Listing expiry is TASK-047.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | yes | Completion and refund go through the escrow service; integration checks compare balances and run completion twice |
| `INV-07` | yes | awaiting_payment → cancelled, delivered → completed and paid → cancelled are documented edges |

## Compatibility and supersession

`startAllCronJobs` keeps its name and is still called from `server.js`. The placeholder test that asserted "jobs are not implemented" is replaced by tests of the jobs.

## Files changed

- `backend/src/modules/orders/order.service.js`
- `backend/src/services/cron.service.js`
- `backend/src/services/order-jobs.service.js`
- `backend/tests/cron-service.test.js`
- `backend/tests/order-jobs.test.js`
- `docs/implement/IMPL-TASK-046.md`
- `.project/evidence/TASK-046/run-01/`
- `.project/state.json and generated views`
