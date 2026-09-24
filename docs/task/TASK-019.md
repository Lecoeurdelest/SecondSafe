---
id: TASK-019
title: Listing detail and seller listings
execution_status: todo
relevance: current
depends_on: [TASK-018]
supersedes: []
superseded_by: null
---

# TASK-019 — Listing detail and seller listings

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROD-06](../requirements/FR-PROD.md#fr-prod-06--list-my-listings), [FR-PROD-07](../requirements/FR-PROD.md#fr-prod-07--view-listing-detail) |
| Acceptance criteria | `AC-PROD-06-1`, `AC-PROD-07-1` |
| Components | `CMP-CATALOG` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | — |

## Objective

Buyers view listing detail and sellers view their own listings.

## In scope

- GET /products/:id
- GET /products/my-products

## Out of scope

- Search

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-018 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/products/product.*.js`

## Invariants and constraints

- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.

## Acceptance criteria and verification

- [ ] `AC-PROD-06-1` (FR-PROD-06) — GET /api/products/my-products returns the caller's listings filtered by status, paginated (default 20, maximum 100). Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-07-1` (FR-PROD-07) — The detail returns the listing with a seller summary and returns 404 when the seller is deleted or suspended. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-019/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-019.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
