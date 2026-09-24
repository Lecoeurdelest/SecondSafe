---
id: TASK-036
title: Reviews and rating statistics
execution_status: todo
relevance: current
depends_on: [TASK-009, TASK-033]
supersedes: []
superseded_by: null
---

# TASK-036 — Reviews and rating statistics

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-REV-01](../requirements/FR-REV.md#fr-rev-01--review-a-seller), [FR-REV-02](../requirements/FR-REV.md#fr-rev-02--read-reviews-and-rating-statistics), [FR-REV-03](../requirements/FR-REV.md#fr-rev-03--edit-or-remove-own-review), [FR-REV-04](../requirements/FR-REV.md#fr-rev-04--list-my-reviews), [FR-REV-05](../requirements/FR-REV.md#fr-rev-05--maintain-seller-rating) |
| Acceptance criteria | `AC-REV-01-1`, `AC-REV-01-2`, `AC-REV-02-1`, `AC-REV-03-1`, `AC-REV-04-1`, `AC-REV-05-1` |
| Components | `CMP-REVIEWS` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/reports/review.service.js` |

## Objective

Buyers review sellers and everyone can read ratings.

## In scope

- rate, can-review, lists, stats, update, hide, my-reviews

## Out of scope

- Review moderation (TASK-041)

## Inputs and dependencies

- plan.md#4.8 Reviews
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-009 evidence
- TASK-033 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/reports/review.*.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.

## Acceptance criteria and verification

- [ ] `AC-REV-01-1` (FR-REV-01) — Only the buyer of a completed order can review, once per order, with a rating of 1–5, a comment of at most 500 characters and at most 5 png, jpg or mp4 evidence files. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-REV-01-2` (FR-REV-01) — The can-review endpoint reports whether the caller may review the order. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-REV-02-1` (FR-REV-02) — Active reviews and rating statistics (average and star distribution) are publicly readable. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-REV-03-1` (FR-REV-03) — Only the author can update a review (rating 1–5) or remove it, and removal hides the review. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-REV-04-1` (FR-REV-04) — GET /api/reviews/reviews/my-reviews returns the caller's reviews; the route is declared before /reviews/:reviewId. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-REV-05-1` (FR-REV-05) — A user's rating and review count are recalculated from active reviews after every create, update, hide or moderation change. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-036/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-036.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
