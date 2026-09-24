---
id: TASK-021
title: Favorites
execution_status: todo
relevance: current
depends_on: [TASK-018]
supersedes: []
superseded_by: null
---

# TASK-021 — Favorites

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-FAV-01](../requirements/FR-FAV.md#fr-fav-01--add-and-remove-favorites), [FR-FAV-02](../requirements/FR-FAV.md#fr-fav-02--list-favorites) |
| Acceptance criteria | `AC-FAV-01-1`, `AC-FAV-02-1` |
| Components | `CMP-CATALOG` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | `WDP@1cea2b7:backend/src/modules/users/favorite.controller.js` |

## Objective

Users keep a list of favorite listings.

## In scope

- Add, remove, check, list

## Out of scope

- Price alerts

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-018 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/users/favorite.*.js`

## Invariants and constraints

- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.

## Acceptance criteria and verification

- [ ] `AC-FAV-01-1` (FR-FAV-01) — A user can add, remove and check a favorite; adding an existing favorite is idempotent. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-FAV-02-1` (FR-FAV-02) — Favorites are listed with pagination and without listings that no longer exist. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-021/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-021.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
