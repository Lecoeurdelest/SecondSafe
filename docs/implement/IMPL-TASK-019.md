---
task: TASK-019
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-019 — Listing detail and seller listings

## What was built

`GET /api/products/my-products` returns the caller's listings with a status filter and marks listings that have an open order. The listing detail now recognises its owner, who can open a hidden or reserved listing to edit it; everyone else still sees only active listings of sellers who are not suspended or restricted. The public list accepts `seller=<id>` so a public profile shows that seller's listings.

## Acceptance criteria

- [x] `AC-PROD-06-1` — observed passing. tests/seller-listings.test.js (status filter, default 20, maximum 100); integration section seller-listings.
- [x] `AC-PROD-07-1` — observed passing. tests/seller-listings.test.js and tests/products.test.js (seller summary, 404 for a suspended or missing seller); integration section seller-listings.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 240 tests in 29 suites pass (`.project/evidence/TASK-019/run-01/jest.txt`). |
| Integration | 26 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings (`.project/evidence/TASK-019/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-019/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

`seller=` is not named in the criteria; the migrated public profile page already sends it, and without it the page listed every seller.

## Known gaps

`listProducts` in `product.service.js` was written before this task and exceeds the complexity limit (cyclomatic 20); this task changes one line of it and does not refactor it.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-02` | no | Read only |
| `INV-03` | yes | Listings of suspended or restricted sellers stay hidden; a malformed or ineligible seller filter returns an empty list |

## Compatibility and supersession

The detail response keeps the seller summary without contact data. `my-products` is declared before `/:id`.

## Files changed

- `backend/src/modules/products/product-management.service.js`
- `backend/src/modules/products/product.controller.js`
- `backend/src/modules/products/product.route.js`
- `backend/src/modules/products/product.service.js`
- `backend/tests/seller-listings.test.js`
- `docs/implement/IMPL-TASK-019.md`
- `.project/evidence/TASK-019/run-01/`
- `.project/state.json and generated views`
