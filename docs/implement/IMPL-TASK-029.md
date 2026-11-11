---
task: TASK-029
execution_status: blocked
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-029 — Withdrawal approval

## What was built

Approving or rejecting a withdrawal now happens in one service used by both the admin wallet routes and the moderator console. Approval debits the wallet and completes the request in one transaction, recording the balance before and after on the request itself; rejection records who refused and why, and moves no money. Only pending requests can be processed.

## Acceptance criteria

- [ ] `AC-PAY-06-1` — not verified. flow-review.md shows one approval flow used by the admin routes and the moderator routes. The owning role depends on D-105, which is still proposed.
- [x] `AC-PAY-06-2` — observed passing. tests/withdrawal.test.js and tests/moderator-withdrawals.test.js; flow-review.md; integration section withdrawals (debit once, repeated approval refused, rejection records the reason without a debit).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 334 tests in 38 suites pass (`.project/evidence/TASK-029/run-01/jest.txt`). |
| Integration | 121 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation, order-review-moderation, dispute-resolution, withdrawals (`.project/evidence/TASK-029/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-029/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-029/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline had two flows: the admin flow debited the wallet in a transaction, and the moderator flow called `decrementBalance`, which wrote a second withdrawal record. Both now use the admin logic.

## Known gaps

D-105 is not accepted, so this task stays blocked. Bank transfer automation is out of scope. Notifying the user of the outcome (TASK-010 dependency) is not implemented.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | yes | One transaction per approval; integration checks compare the balance after an approval, a repeated approval and a rejection |
| `INV-03` | no | — |
| `INV-04` | no | — |
| `INV-07` | no | — |
| `INV-08` | yes | Amounts are the integer VND stored on the request |

## Compatibility and supersession

Admin and moderator paths and their response shapes are kept. `wallet.controller.js` keeps its handlers and delegates to the service.

## Files changed

- `backend/src/modules/moderator/moderator.controller.js`
- `backend/src/modules/moderator/moderator.route.js`
- `backend/src/modules/moderator/moderator.service.js`
- `backend/src/modules/payments/wallet.controller.js`
- `backend/src/modules/payments/withdrawal.service.js`
- `backend/tests/moderator-withdrawals.test.js`
- `backend/tests/withdrawal.test.js`
- `docs/implement/IMPL-TASK-029.md`
- `.project/evidence/TASK-029/run-01/`
- `.project/state.json and generated views`
