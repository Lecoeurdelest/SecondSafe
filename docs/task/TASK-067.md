---
id: TASK-067
title: Web moderator shell, dashboard and profile
execution_status: todo
relevance: current
depends_on: [TASK-055, TASK-039]
supersedes: []
superseded_by: null
---

# TASK-067 — Web moderator shell, dashboard and profile

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-14](../requirements/FR-WEB.md#fr-web-14--web-moderator-shell-dashboard-and-profile) |
| Acceptance criteria | `AC-WEB-14-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M7 Web client |
| Baseline references | `WDP@1cea2b7:frontend/src/modules/moderator/layout/`, `WDP@1cea2b7:frontend/src/modules/moderator/dashboard/`, `WDP@1cea2b7:frontend/src/modules/moderator/profile/`, `WDP@1cea2b7:frontend/src/services/moderator.service.js` |

## Objective

Moderator and admin roles can navigate the responsive console and load dashboard/profile data; regular users cannot enter and locked moderators are denied.

## In scope

- frontend/src/modules/moderator/layout/
- frontend/src/modules/moderator/dashboard/
- frontend/src/modules/moderator/profile/
- frontend/src/services/moderator.service.js
- Associated styles, assets and tests; API contract alignment; observable loading, empty and failure states

## Out of scope

- Unrelated modules
- Schema or business-rule changes outside an explicit task
- Production deployment or live payment execution

## Inputs and dependencies

- plan.md#12. Migration amendment (2026-10-09)
- docs/technical/migration-wdp.md
- docs/technical/gitflow.md
- docs/technical/architecture.md
- TASK-055 evidence
- TASK-039 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/src/modules/moderator/layout/`
- `frontend/src/modules/moderator/dashboard/`
- `frontend/src/modules/moderator/profile/`
- `frontend/src/services/moderator.service.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-14-1` (FR-WEB-14) — Moderator and admin roles can navigate the responsive console and load dashboard/profile data; regular users cannot enter and locked moderators are denied. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-067/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-067.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
