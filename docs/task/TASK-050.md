---
id: TASK-050
title: Audit logging
execution_status: todo
relevance: current
depends_on: [TASK-029, TASK-040, TASK-041, TASK-042, TASK-045]
supersedes: []
superseded_by: null
---

# TASK-050 — Audit logging

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-OBS-01](../requirements/NFR.md#nfr-obs-01--logging-and-audit-trail) |
| Acceptance criteria | `AC-NFR-OBS-01-2` |
| Components | `CMP-PLATFORM` |
| Decisions | `D-003` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Sensitive actions leave an audit trail.

## In scope

- Audit collection (new schema with migration note)
- Hooks in moderator, admin and money services

## Out of scope

- Log shipping

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-029 evidence
- TASK-040 evidence
- TASK-041 evidence
- TASK-042 evidence
- TASK-045 evidence

## Technical approach

Adding the audit collection is a schema change: document it in docs/technical/data-model.md and the implementation record.

## Files and symbols

- `backend/src/modules/audit/`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NFR-OBS-01-2` (NFR-OBS-01) — Admin, moderator and money actions write an audit record with actor, action, target and time. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-050/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-050.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
