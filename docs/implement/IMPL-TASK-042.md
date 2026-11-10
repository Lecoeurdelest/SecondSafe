---
task: TASK-042
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-042 — Dispute resolution

## What was built

Moderators list disputes (pending first, then investigating, then resolved), open one, start the investigation, post in the conversation and settle the dispute as a refund to the buyer or a release to the seller. The party the decision goes against records a dispute violation; at the configured count the selling restriction applies for the configured time. Both parties are notified when the investigation starts and when a moderator posts.

## Acceptance criteria

- [x] `AC-MOD-06-1` — observed passing. tests/dispute-resolution.test.js; integration section dispute-resolution (pending cannot be settled; investigating; message; resolved).
- [x] `AC-MOD-06-2` — observed passing. tests/dispute-resolution.test.js; flow-review.md; integration section dispute-resolution (buyer refunded in full; seller paid minus the fee; order and listing states; second settlement refused).
- [x] `AC-MOD-06-3` — observed passing. tests/dispute-resolution.test.js; integration section dispute-resolution (third violation restricts selling for 30 days).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 329 tests in 36 suites pass (`.project/evidence/TASK-042/run-01/jest.txt`). |
| Integration | 110 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation, dispute-resolution (`.project/evidence/TASK-042/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-042/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-042/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

A dispute must be under investigation before it can be settled, and the resolution must be `refund` or `release`; the baseline accepted any value and then marked the dispute resolved without moving money. Recording a violation for the losing party implements AC-MOD-06-3; the baseline defined the function and never called it.

## Known gaps

Partial refunds are TASK-043 (blocked on D-106).

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | yes | Settlement goes through the escrow service only; integration checks compare balances |
| `INV-03` | yes | Violations use the selling-restriction utility |
| `INV-04` | yes | Admins never record a violation |
| `INV-05` | yes | Routes are limited to staff |
| `INV-07` | yes | Refund cancels and release completes the order through the documented edges |

## Compatibility and supersession

Baseline moderator dispute paths are kept.

## Files changed

- `backend/src/modules/moderator/moderator.controller.js`
- `backend/src/modules/moderator/moderator.route.js`
- `backend/src/modules/moderator/moderator.service.js`
- `backend/tests/dispute-resolution.test.js`
- `docs/implement/IMPL-TASK-042.md`
- `.project/evidence/TASK-042/run-01/`
- `.project/state.json and generated views`
