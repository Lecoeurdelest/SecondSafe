---
task: TASK-039
execution_status: in_progress
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-039 — Moderator dashboard and revenue report

## What was built

`GET /api/moderator/revenue-report` reports completed orders in a date range: totals, a monthly breakdown, the five best-selling listings and the ten latest orders. Each order's fee is its stored platform fee; an order without one is charged the configured rate (`PLATFORM_FEE_RATE`), rounded to integer VND. The moderator router now applies authentication and the staff role once for every route.

## Acceptance criteria

- [x] `AC-ORD-12-2` — observed passing. tests/revenue-report.test.js (aggregation and per-order fallback use business.feeRate, rounded to integer VND); integration section revenue.
- [ ] `AC-MOD-01-1` — not verified. The moderator dashboard endpoint already existed before this task and is not changed here; its counts and five latest reports were not compared with the criterion.
- [x] `AC-MOD-08-1` — observed passing. tests/revenue-report.test.js (requested range, default last 12 months, grouped by month over completed orders); integration section revenue.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 287 tests in 33 suites pass (`.project/evidence/TASK-039/run-01/jest.txt`). |
| Integration | 72 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue (`.project/evidence/TASK-039/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-039/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline hard-coded 5% in three places; the rate now comes from the business configuration that the order service uses.

## Known gaps

AC-MOD-01-1 is not verified here: the dashboard endpoint (`moderator.dashboard.service.js`) predates this task and returns a different set of numbers from the criterion. Charts are out of scope.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | Read only |
| `INV-03` | no | — |
| `INV-04` | no | — |
| `INV-07` | no | — |
| `INV-08` | yes | Fees are rounded to integer VND |

## Compatibility and supersession

The response shape (`rule`, `range`, `summary`, `breakdown`, `topProducts`, `recentOrders`) is the baseline shape used by the migrated revenue page.

## Files changed

- `backend/src/modules/moderator/moderator.controller.js`
- `backend/src/modules/moderator/moderator.route.js`
- `backend/src/modules/moderator/moderator.service.js`
- `backend/tests/revenue-report.test.js`
- `docs/implement/IMPL-TASK-039.md`
- `.project/evidence/TASK-039/run-01/`
- `.project/state.json and generated views`
