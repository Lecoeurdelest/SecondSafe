---
id: TASK-048
title: Listing pre-publication moderation
execution_status: blocked
relevance: current
depends_on: [TASK-018, TASK-040]
supersedes: []
superseded_by: null
---

# TASK-048 — Listing pre-publication moderation

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-103 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PROD-09](../requirements/FR-PROD.md#fr-prod-09--pre-publication-listing-moderation) |
| Acceptance criteria | `AC-PROD-09-1` |
| Components | `CMP-CATALOG`, `CMP-MODERATION` |
| Decisions | `D-103` (proposed) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

New listings wait for moderator approval if D-103 adopts moderation.

## In scope

- Pending queue, approve, reject with reason

## Out of scope

- Automatic content scanning

## Inputs and dependencies

- plan.md#4.3 Listings and catalog
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-018 evidence
- TASK-040 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/products/`
- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-PROD-09-1` (FR-PROD-09) — When enabled by D-103, new listings stay pending until a moderator approves them, and rejection stores a reason visible to the seller. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-048/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-048.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- D-103 keeps immediate publishing: retire this task

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
