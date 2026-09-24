---
id: TASK-045
title: Admin restrictions, moderator lock and dashboard
execution_status: todo
relevance: current
depends_on: [TASK-039, TASK-044]
supersedes: []
superseded_by: null
---

# TASK-045 — Admin restrictions, moderator lock and dashboard

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ADM-01](../requirements/FR-ADM.md#fr-adm-01--admin-dashboard), [FR-ADM-06](../requirements/FR-ADM.md#fr-adm-06--restrict-or-restore-selling), [FR-ADM-07](../requirements/FR-ADM.md#fr-adm-07--lock-or-unlock-moderators), [FR-ADM-08](../requirements/FR-ADM.md#fr-adm-08--admin-access-to-moderation) |
| Acceptance criteria | `AC-ADM-01-1`, `AC-ADM-06-1`, `AC-ADM-07-1`, `AC-ADM-08-1` |
| Components | `CMP-ADMIN` |
| Decisions | `D-001` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Admins restrict sellers, lock moderators and monitor the platform.

## In scope

- suspend/unsuspend, lock/unlock, dashboard and stats, admin access to moderation

## Out of scope

- Role editor UI

## Inputs and dependencies

- plan.md#4.12 Administration
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-039 evidence
- TASK-044 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/users/`

## Invariants and constraints

- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-ADM-01-1` (FR-ADM-01) — Admins see user, order, report and pending-withdrawal statistics. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-06-1` (FR-ADM-06) — Admins restrict selling with a duration and reason (default by violation count: 24 hours, 1 week from 6, 1 year from 9) and hide the seller's active listings, or lift the restriction. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-07-1` (FR-ADM-07) — Lock and unlock apply only to moderators, use the lock endpoints (not selling restriction) and are refused while the moderator has active orders. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-08-1` (FR-ADM-08) — Admins can use every moderator endpoint. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-045/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-045.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
