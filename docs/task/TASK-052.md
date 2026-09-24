---
id: TASK-052
title: Performance baseline
execution_status: todo
relevance: current
depends_on: [TASK-049]
supersedes: []
superseded_by: null
---

# TASK-052 — Performance baseline

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-PERF-03](../requirements/NFR.md#nfr-perf-03--response-time-baseline) |
| Acceptance criteria | `AC-NFR-PERF-03-1` |
| Components | `CMP-PLATFORM` |
| Decisions | `D-001` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Response times are measured against the proposed targets.

## In scope

- Load test script, seeded dataset, recorded p95

## Out of scope

- Infrastructure tuning

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-049 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `.project/evidence/TASK-052/`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NFR-PERF-03-1` (NFR-PERF-03) — A load test records p95 latency with 100 concurrent users against the proposed targets (read ≤500 ms, write ≤1 s) and the result is recorded in the evidence. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-052/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-052.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
