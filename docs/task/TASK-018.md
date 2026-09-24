---
id: TASK-018
title: Listing management
execution_status: todo
relevance: current
depends_on: [TASK-006, TASK-009, TASK-017]
supersedes: []
superseded_by: null
---

# TASK-018 — Listing management

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROD-01](../requirements/FR-PROD.md#fr-prod-01--create-a-listing), [FR-PROD-03](../requirements/FR-PROD.md#fr-prod-03--edit-a-listing), [FR-PROD-04](../requirements/FR-PROD.md#fr-prod-04--delete-a-listing), [FR-PROD-05](../requirements/FR-PROD.md#fr-prod-05--hide-or-show-a-listing) |
| Acceptance criteria | `AC-PROD-01-1`, `AC-PROD-01-2`, `AC-PROD-01-3`, `AC-PROD-01-4`, `AC-PROD-03-1`, `AC-PROD-04-1`, `AC-PROD-05-1` |
| Components | `CMP-CATALOG` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | `WDP@1cea2b7:backend/src/modules/products/product.service.js` |

## Objective

Sellers create, edit, delete and hide listings under the state rules.

## In scope

- Create, update, soft delete, visibility

## Out of scope

- Pre-publication moderation (TASK-048)

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-006 evidence
- TASK-009 evidence
- TASK-017 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/products/product.*.js`

## Invariants and constraints

- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.

## Acceptance criteria and verification

- [ ] `AC-PROD-01-1` (FR-PROD-01) — Title (≤200 characters), description (≤2000), price (integer VND ≥0), at least one category, condition (new, like-new, good, fair, poor), at least one image, city and district are required; violations return 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-01-2` (FR-PROD-01) — An optional other-category label is limited to 100 characters. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-01-3` (FR-PROD-01) — A seller under selling restriction receives 403. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-01-4` (FR-PROD-01) — A valid listing is published with status active (unless decision D-103 introduces pre-publication moderation). Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-03-1` (FR-PROD-03) — Only the owner can edit; a sold listing, a reserved listing or a listing linked to an active order cannot be edited. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-04-1` (FR-PROD-04) — Only the owner can delete, under the same state rules as editing; deletion sets status deleted instead of removing the document. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PROD-05-1` (FR-PROD-05) — The owner toggles active and hidden; a restricted seller cannot re-activate; deleted, sold and reserved listings cannot change visibility. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-018/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-018.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
