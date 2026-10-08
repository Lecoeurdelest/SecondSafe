---
id: TASK-017
title: Categories API
execution_status: ready
relevance: current
depends_on: [TASK-003]
supersedes: []
superseded_by: null
---

# TASK-017 — Categories API

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `ready` — Dependencies complete; ready to implement and verify

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROD-08](../requirements/FR-PROD.md#fr-prod-08--categories) |
| Acceptance criteria | `AC-PROD-08-1` |
| Components | `CMP-CATALOG` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | `WDP@1cea2b7:backend/src/modules/products/category.route.js` |

## Objective

Clients read active categories.

## In scope

- List and get-by-slug

## Out of scope

- Category administration

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-003 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/products/category.route.js`

## Invariants and constraints

- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.

## Acceptance criteria and verification

- [ ] `AC-PROD-08-1` (FR-PROD-08) — Active categories are listed sorted by name; an unknown or inactive slug returns 404. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-017/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-017.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
