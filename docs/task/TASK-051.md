---
id: TASK-051
title: API documentation
execution_status: todo
relevance: current
depends_on: [TASK-049]
supersedes: []
superseded_by: null
---

# TASK-051 — API documentation

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-MNT-04](../requirements/NFR.md#nfr-mnt-04--project-documentation) |
| Acceptance criteria | `AC-NFR-MNT-04-2` |
| Components | `CMP-CONTROL` |
| Decisions | `D-008` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Every endpoint is described in OpenAPI.

## In scope

- OpenAPI 3 description generated or written from routes

## Out of scope

- Hosted API portal

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-049 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `docs/technical/openapi.yaml`

## Invariants and constraints

- None beyond the global rules in plan.md §6.

## Acceptance criteria and verification

- [ ] `AC-NFR-MNT-04-2` (NFR-MNT-04) — An OpenAPI description covers every endpoint. Verify with: document check; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-051/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-051.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
