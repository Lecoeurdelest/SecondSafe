---
task: TASK-018
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-018 — Listing management

## What was built

A new `product-management.service.js` holds the write side of listings so the existing read service stays as it is. Create validates every field and resolves categories by id or slug; update applies only the editable fields; delete sets status `deleted`; visibility switches between `active` and `hidden`. A listing that is sold, reserved or tied to an open order is read-only (INV-02), and a seller under restriction cannot publish or re-activate (INV-03). Creating a listing sends the baseline "listing published" notification.

## Acceptance criteria

- [x] `AC-PROD-01-1` — observed passing. tests/listing-management.test.js (each required field and bound); integration section listing.
- [x] `AC-PROD-01-2` — observed passing. tests/listing-management.test.js (101 characters rejected, 100 accepted).
- [x] `AC-PROD-01-3` — observed passing. tests/listing-management.test.js; integration section listing (restricted seller receives 403).
- [x] `AC-PROD-01-4` — observed passing. tests/listing-management.test.js; integration section listing (status active, caller-supplied status ignored).
- [x] `AC-PROD-03-1` — observed passing. tests/listing-management.test.js (owner only; sold, reserved and order-linked listings read-only); integration section listing.
- [x] `AC-PROD-04-1` — observed passing. tests/listing-management.test.js; integration section listing (document kept with status deleted).
- [x] `AC-PROD-05-1` — observed passing. tests/listing-management.test.js (toggle, restricted seller cannot re-activate, sold/reserved/deleted refused).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 234 tests in 28 suites pass (`.project/evidence/TASK-018/run-01/jest.txt`). |
| Integration | 19 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing (`.project/evidence/TASK-018/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-018/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

Prices must be integer VND and may be 0, as the criterion states; the baseline required a truthy price and accepted fractions. An other-category label over 100 characters is rejected instead of being stored.

## Known gaps

`GET /api/products/my-products` belongs to TASK-019. Pre-publication moderation (TASK-048) is not part of this task.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-02` | yes | Edit, delete and visibility refuse sold, reserved and order-linked listings (tests/listing-management.test.js) |
| `INV-03` | yes | Publishing and re-activating check the selling restriction |

## Compatibility and supersession

Baseline paths and response messages are kept. Status, seller, views and moderation fields sent by a client are ignored.

## Files changed

- `backend/src/modules/products/product-management.service.js`
- `backend/src/modules/products/product.controller.js`
- `backend/src/modules/products/product.route.js`
- `backend/tests/listing-management.test.js`
- `docs/implement/IMPL-TASK-018.md`
- `.project/evidence/TASK-018/run-01/`
- `.project/state.json and generated views`
