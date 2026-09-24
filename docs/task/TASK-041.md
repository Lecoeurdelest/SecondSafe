---
id: TASK-041
title: Order and review moderation
execution_status: todo
relevance: current
depends_on: [TASK-033, TASK-036]
supersedes: []
superseded_by: null
---

# TASK-041 — Order and review moderation

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-MOD-04](../requirements/FR-MOD.md#fr-mod-04--moderate-orders), [FR-MOD-05](../requirements/FR-MOD.md#fr-mod-05--moderate-reviews) |
| Acceptance criteria | `AC-MOD-04-1`, `AC-MOD-04-2`, `AC-MOD-05-1`, `AC-MOD-05-2` |
| Components | `CMP-MODERATION` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Moderators correct order states and judge reviews.

## In scope

- Order list/detail/status/force-cancel, review hide/mark-good/mark-bad

## Out of scope

- Refund decisions outside the escrow service

## Inputs and dependencies

- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-033 evidence
- TASK-036 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-MOD-04-1` (FR-MOD-04) — Moderators list, filter and open orders. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-04-2` (FR-MOD-04) — Status changes follow the moderator transition matrix, cancellation requires a note of at least 10 characters, completed orders cannot be force-cancelled, and money effects run through the escrow service. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-05-1` (FR-MOD-05) — Moderators can hide reviews and mark each review good or bad once; reviews of 4 stars or more are approved automatically. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-05-2` (FR-MOD-05) — Marking a review bad increments the seller's bad-review count and applies a selling restriction of 24 hours, 1 week or 1 year at 3, 6 and 9. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-041/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-041.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
