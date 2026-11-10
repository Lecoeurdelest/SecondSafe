---
task: TASK-038
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-038 — Disputes for buyers and sellers

## What was built

The buyer of a shipped or delivered order opens one dispute with a reason, a description and at least one evidence file; the dispute and the order's move to `disputed` are written in one transaction. While a moderator is investigating, the seller can respond and the buyer can add notes or files; each message is appended to the dispute conversation. A seller confirms a returned item once, for return requests only. A user's dispute list covers disputes where they are the buyer or the seller, and detail is limited to the two parties and staff.

## Acceptance criteria

- [x] `AC-DSP-01-1` — observed passing. tests/disputes.test.js; integration section disputes.
- [x] `AC-DSP-01-2` — observed passing. tests/disputes.test.js (dispute and order saved with the same session; a failed write leaves the order untouched); flow-review.md; integration section disputes.
- [x] `AC-DSP-02-1` — observed passing. tests/disputes.test.js; integration section disputes.
- [x] `AC-DSP-03-1` — observed passing. tests/disputes.test.js; integration section disputes.
- [x] `AC-DSP-04-1` — observed passing. tests/disputes.test.js; integration section disputes (refused for a non-return dispute).
- [x] `AC-DSP-05-1` — observed passing. tests/disputes.test.js; integration section disputes (seller sees the dispute in their list; unrelated user refused).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 283 tests in 32 suites pass (`.project/evidence/TASK-038/run-01/jest.txt`). |
| Integration | 67 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes (`.project/evidence/TASK-038/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-038/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-038/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline created the dispute and changed the order in two separate writes, and listed only the buyer's disputes. Descriptions are limited to 1000 characters.

## Known gaps

Moving a dispute to investigating and settling it are TASK-042.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-05` | yes | Detail and lists are limited to the parties and staff (tests/disputes.test.js) |

## Compatibility and supersession

Baseline paths and messages are kept.

## Files changed

- `backend/src/modules/reports/report.controller.js`
- `backend/src/modules/reports/report.route.js`
- `backend/src/modules/reports/report.service.js`
- `backend/tests/disputes.test.js`
- `docs/implement/IMPL-TASK-038.md`
- `.project/evidence/TASK-038/run-01/`
- `.project/state.json and generated views`
