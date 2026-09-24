---
id: TASK-040
title: Report moderation and sanctions
execution_status: todo
relevance: current
depends_on: [TASK-006, TASK-037]
supersedes: []
superseded_by: null
---

# TASK-040 — Report moderation and sanctions

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-MOD-02](../requirements/FR-MOD.md#fr-mod-02--moderate-violation-reports), [FR-MOD-03](../requirements/FR-MOD.md#fr-mod-03--apply-sanctions), [FR-MOD-07](../requirements/FR-MOD.md#fr-mod-07--suspend-a-user) |
| Acceptance criteria | `AC-MOD-02-1`, `AC-MOD-02-2`, `AC-MOD-02-3`, `AC-MOD-03-1`, `AC-MOD-03-2`, `AC-MOD-07-1` |
| Components | `CMP-MODERATION` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Moderators resolve reports and sanctions follow the thresholds.

## In scope

- Report list/detail/resolve, sanctions, user suspension

## Out of scope

- Dispute resolution

## Inputs and dependencies

- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-006 evidence
- TASK-037 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/moderator/`
- `backend/src/modules/reports/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-MOD-02-1` (FR-MOD-02) — Moderators list, filter and open reports with reporter and target violation statistics. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-02-2` (FR-MOD-02) — Resolution sets status resolved or dismissed with decision remove_content, warn_user, ban_user or reply_feedback; dismissal allows only reply_feedback, remove_content applies only to listing reports, and processed reports cannot be resolved again. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-02-3` (FR-MOD-02) — Resolution notifies the reporter and the reported user, and both baseline resolve paths share one handler. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-03-1` (FR-MOD-03) — warn_user increments the violation count and applies a selling restriction of 24 hours, 1 week or 1 year at 3, 6 and 9 warnings. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-03-2` (FR-MOD-03) — A listing with three resolved warn_user reports is removed, remove_content removes the listing, ban_user applies an indefinite selling restriction, and admins are never sanctioned. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-07-1` (FR-MOD-07) — A moderator can suspend a non-admin user with a reason. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-040/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-040.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
