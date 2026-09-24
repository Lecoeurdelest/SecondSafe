---
id: TASK-010
title: Notifications
execution_status: todo
relevance: current
depends_on: [TASK-005]
supersedes: []
superseded_by: null
---

# TASK-010 — Notifications

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-NOTI-01](../requirements/FR-NOTI.md#fr-noti-01--create-and-push-notifications), [FR-NOTI-02](../requirements/FR-NOTI.md#fr-noti-02--read-notifications), [FR-NOTI-03](../requirements/FR-NOTI.md#fr-noti-03--mark-notifications-read) |
| Acceptance criteria | `AC-NOTI-01-1`, `AC-NOTI-02-1`, `AC-NOTI-03-1` |
| Components | `CMP-NOTIFY` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/modules/notifications/` |

## Objective

Domain events create notifications that users can read and acknowledge.

## In scope

- notification.service createNotification
- Unread, count, list, mark read, mark all read

## Out of scope

- Socket push (TASK-023)

## Inputs and dependencies

- plan.md#4.10 Notifications
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-005 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/notifications/`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-NOTI-01-1` (FR-NOTI-01) — Notifications are stored with a type from the allowed list and links to the related order, listing, dispute, report or review. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NOTI-02-1` (FR-NOTI-02) — Unread notifications, the unread count and the paginated history are scoped to the caller. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NOTI-03-1` (FR-NOTI-03) — A user can mark one of their own notifications, or all of them, as read. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-010/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-010.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
