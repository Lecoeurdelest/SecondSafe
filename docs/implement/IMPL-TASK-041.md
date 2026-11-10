---
task: TASK-041
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-041 — Order and review moderation

## What was built

Moderators list, filter and open orders, and correct an order's status inside a fixed transition matrix. Cancelling refunds any escrow hold to the buyer and reopens the listing; completing releases the hold to the seller, completes the order and marks the listing sold. Moderators hide reviews (the seller rating is recalculated) and judge each low-rated review once: a bad review counts against the seller and restricts selling at 3, 6 and 9. Reviews of four stars or more never enter the queue.

## Acceptance criteria

- [x] `AC-MOD-04-1` — observed passing. tests/order-review-moderation.test.js; integration section order-review-moderation.
- [x] `AC-MOD-04-2` — observed passing. tests/order-review-moderation.test.js (matrix, note length, refund through the cancel flow, release through escrow); flow-review.md; integration section order-review-moderation (balances before and after).
- [x] `AC-MOD-05-1` — observed passing. tests/order-review-moderation.test.js; integration section order-review-moderation (four-star reviews never queue; a review is judged once).
- [x] `AC-MOD-05-2` — observed passing. tests/order-review-moderation.test.js (counts 1, 3, 6 and 9 with configured durations); integration section order-review-moderation (first bad review counted).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 321 tests in 35 suites pass (`.project/evidence/TASK-041/run-01/jest.txt`). |
| Integration | 96 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation (`.project/evidence/TASK-041/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-041/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-041/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline changed the order status and left the money in escrow. Force-cancelling a paid order returned 500 after refunding because the refund ran inside a second transaction on the same documents; the refund is now the only transaction. Sanction steps and durations come from the business configuration.

## Known gaps

A moderator completion releases escrow and then updates the order in a second step; if the second step fails the hold is released while the order still shows its old status. Fulfilment atomicity belongs to TASK-033 (AC-NFR-REL-01-3).

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | yes | Every money effect goes through escrowService.refundFunds or releaseFunds; integration checks compare balances |
| `INV-03` | yes | Bad-review sanctions use the selling-restriction utility |
| `INV-04` | yes | An admin seller is never penalised |
| `INV-07` | yes | Corrections are limited to the transition matrix (tests/order-review-moderation.test.js) |

## Compatibility and supersession

Baseline moderator paths are kept. `order.service.js` changes only in `forceCancelOrder`.

## Files changed

- `backend/src/modules/moderator/moderator.controller.js`
- `backend/src/modules/moderator/moderator.route.js`
- `backend/src/modules/moderator/moderator.service.js`
- `backend/src/modules/orders/order.service.js`
- `backend/tests/order-review-moderation.test.js`
- `docs/implement/IMPL-TASK-041.md`
- `.project/evidence/TASK-041/run-01/`
- `.project/state.json and generated views`
