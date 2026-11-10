---
task: TASK-047
execution_status: blocked
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-047 — Listing expiry job

## What was built

A daily job at 03:00 local time sets active listings older than `LISTING_MAX_AGE_MS` (30 days) to `expired`. Listings reserved by an open order are skipped, and no document is deleted. The scheduler gains a wall-clock daily mode next to the interval mode.

## Acceptance criteria

- [ ] `AC-SYS-04-1` — not verified. The job runs daily at 03:00 local time on listings older than the configured age (tests/cron-service.test.js, tests/order-jobs.test.js, integration section listing-expiry). It sets status expired, the recommended option of D-107, which is still proposed; the open PR #103 proposes the baseline deletion instead.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 352 tests in 40 suites pass (`.project/evidence/TASK-047/run-01/jest.txt`). |
| Integration | 153 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation, dispute-resolution, withdrawals, jobs, abandoned-checkout, listing-expiry (`.project/evidence/TASK-047/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-047/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline deletes the listing documents. This implementation follows the recommendation recorded for D-107 (soft expire).

## Known gaps

D-107 is not accepted, so this task stays blocked. The open PR #103 proposes the baseline behaviour (delete); if that is the decision, `expireOldListings` must delete instead and the evidence must be re-run. There is no seller renewal flow.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money moves |
| `INV-07` | no | Order status is not changed; listings with an open order are skipped (INV-02) |

## Compatibility and supersession

Uses the existing `expired` listing status. No schema change.

## Files changed

- `backend/src/services/cron.service.js`
- `backend/src/services/order-jobs.service.js`
- `backend/tests/cron-service.test.js`
- `backend/tests/order-jobs.test.js`
- `docs/implement/IMPL-TASK-047.md`
- `.project/evidence/TASK-047/run-01/`
- `.project/state.json and generated views`
