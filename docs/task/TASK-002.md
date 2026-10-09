---
id: TASK-002
title: Verify database scripts against MongoDB
execution_status: ready
relevance: current
depends_on: [TASK-001]
supersedes: []
superseded_by: null
---

# TASK-002 — Verify database scripts against MongoDB

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `ready` — Dependencies complete; ready to implement and verify

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-SYS-06](../requirements/FR-SYS.md#fr-sys-06--database-initialization-scripts), [NFR-PERF-02](../requirements/NFR.md#nfr-perf-02--query-indexes) |
| Acceptance criteria | `AC-SYS-06-3`, `AC-NFR-PERF-02-2` |
| Components | `CMP-DATA` |
| Decisions | `D-003` (accepted) |
| Milestone | M0 Scaffold |
| Baseline references | — |

## Objective

Seed, verification, index and admin scripts are proven on a real MongoDB instance.

## In scope

- Run npm run seed, seed:verify, db:indexes and create-admin against a disposable MongoDB (replica set recommended)
- Store the original console output as evidence

## Out of scope

- Schema changes

## Inputs and dependencies

- plan.md#4.13 Scheduled jobs and data operations
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-001 evidence

## Technical approach

Use a local or containerized MongoDB 7 with a throwaway database; record versions of MongoDB and Node.

## Files and symbols

- `.project/evidence/TASK-002/`

## Invariants and constraints

- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-SYS-06-3` (FR-SYS-06) — Against a MongoDB instance, npm run seed, npm run seed:verify, npm run db:indexes, npm run db:migrate and npm run create-admin complete successfully. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-PERF-02-2` (NFR-PERF-02) — npm run db:indexes creates the declared indexes for every model on a MongoDB instance. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-002/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-002.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- Any script fails because of a schema mismatch — open a schema-change task instead of editing the schema here

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
