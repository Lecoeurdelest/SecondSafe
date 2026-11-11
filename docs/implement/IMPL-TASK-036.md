---
task: TASK-036
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-036 — Reviews and rating statistics

## What was built

The review module is rewritten in the route → controller → service layering. Only the buyer of a completed order can review it, once, with a 1–5 rating, a comment of at most 500 characters and up to five evidence files that were uploaded through the evidence endpoint. Reviews of four stars or more are approved automatically; lower ratings wait for a moderator. The seller's rating and review count are recalculated after every create, edit and removal.

## Acceptance criteria

- [x] `AC-REV-01-1` — observed passing. tests/reviews.test.js (buyer of a completed order, once, rating and comment bounds, evidence count and origin); integration section reviews.
- [x] `AC-REV-01-2` — observed passing. tests/reviews.test.js; integration section reviews (before and after completion).
- [x] `AC-REV-02-1` — observed passing. integration section reviews (public list and star distribution without a session).
- [x] `AC-REV-03-1` — observed passing. tests/reviews.test.js; integration section reviews (author only; removal hides).
- [x] `AC-REV-04-1` — observed passing. integration section reviews (my-reviews resolves before :reviewId).
- [x] `AC-REV-05-1` — observed passing. integration section reviews (rating and count after create, edit and removal). Recalculation after a moderator hides a review is delivered with TASK-041.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 253 tests in 30 suites pass (`.project/evidence/TASK-036/run-01/jest.txt`). |
| Integration | 39 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews (`.project/evidence/TASK-036/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-036/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

Errors carry HTTP statuses (403 not the buyer, 409 already reviewed, 404 unknown) instead of the baseline blanket 400. The rating distribution now matches by ObjectId; the baseline compared a string and always returned zeros.

## Known gaps

Review moderation (hide, mark good or bad) is TASK-041.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-05` | yes | Only the buyer of the order can write; evidence must reference files stored by the evidence upload endpoint |

## Compatibility and supersession

All nine baseline paths under `/api/reviews` are kept; `reviews/my-reviews` is declared before `reviews/:reviewId` (baseline defect).

## Files changed

- `backend/src/modules/reports/review.controller.js`
- `backend/src/modules/reports/review.route.js`
- `backend/src/modules/reports/review.service.js`
- `backend/tests/reviews.test.js`
- `docs/implement/IMPL-TASK-036.md`
- `.project/evidence/TASK-036/run-01/`
- `.project/state.json and generated views`
