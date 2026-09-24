---
id: TASK-020
title: Browse, search and filter
execution_status: todo
relevance: current
depends_on: [TASK-018]
supersedes: []
superseded_by: null
---

# TASK-020 — Browse, search and filter

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-BROW-01](../requirements/FR-BROW.md#fr-brow-01--browse-listings), [FR-BROW-02](../requirements/FR-BROW.md#fr-brow-02--search-listings-by-keyword), [FR-BROW-03](../requirements/FR-BROW.md#fr-brow-03--filter-and-sort-listings), [NFR-SEC-12](../requirements/NFR.md#nfr-sec-12--safe-regular-expressions) |
| Acceptance criteria | `AC-BROW-01-1`, `AC-BROW-02-1`, `AC-BROW-03-1`, `AC-NFR-SEC-12-1` |
| Components | `CMP-CATALOG` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | — |

## Objective

Buyers browse, search and filter active listings efficiently.

## In scope

- List, keyword search, filters, sort

## Out of scope

- Recommendations

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- plan.md#5. Quality requirements
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

- [ ] `AC-BROW-01-1` (FR-BROW-01) — Only active listings are returned, paginated with default 20 and maximum 100 per page. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-BROW-02-1` (FR-BROW-02) — Keyword search uses the text index on title and description, and both baseline search paths share one implementation. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-BROW-03-1` (FR-BROW-03) — Listings can be filtered by category (primary or any listed category), price range and one or more cities, and sorted. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-12-1` (NFR-SEC-12) — Listing search escapes user input before building a regular expression. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-020/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-020.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
