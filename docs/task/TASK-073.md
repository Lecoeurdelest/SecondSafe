---
id: TASK-073
title: Full-stack migration integration and release checks
execution_status: todo
relevance: current
depends_on: [TASK-002, TASK-049, TASK-050, TASK-051, TASK-052, TASK-055, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-062, TASK-063, TASK-064, TASK-065, TASK-066, TASK-067, TASK-068, TASK-069, TASK-070, TASK-071, TASK-072]
supersedes: []
superseded_by: null
---

# TASK-073 — Full-stack migration integration and release checks

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-20](../requirements/FR-WEB.md#fr-web-20--full-stack-migration-integration-and-release-checks), [NFR-USA-02](../requirements/NFR.md#nfr-usa-02--responsive-user-interface), [NFR-COMP-01](../requirements/NFR.md#nfr-comp-01--browser-support) |
| Acceptance criteria | `AC-WEB-20-1`, `AC-NFR-USA-02-1`, `AC-NFR-COMP-01-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M8 Full-stack integration |
| Baseline references | `WDP@1cea2b7:frontend/e2e/` |

## Objective

A disposable replica-set environment passes buyer/seller/staff end-to-end journeys, existing backend criteria, frontend tests/build and privacy checks; every task PR and new commit has the sole authorized author; remaining provider credentials and manual sandbox checks are explicitly reported.

## In scope

- frontend/e2e/
- docs/technical/migration-wdp.md
- docs/technical/release-checklist.md
- .github/workflows/
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
- TASK-002 evidence
- TASK-049 evidence
- TASK-050 evidence
- TASK-051 evidence
- TASK-052 evidence
- TASK-055 evidence
- TASK-056 evidence
- TASK-057 evidence
- TASK-058 evidence
- TASK-059 evidence
- TASK-060 evidence
- TASK-061 evidence
- TASK-062 evidence
- TASK-063 evidence
- TASK-064 evidence
- TASK-065 evidence
- TASK-066 evidence
- TASK-067 evidence
- TASK-068 evidence
- TASK-069 evidence
- TASK-070 evidence
- TASK-071 evidence
- TASK-072 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/e2e/`
- `docs/technical/migration-wdp.md`
- `docs/technical/release-checklist.md`
- `.github/workflows/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-20-1` (FR-WEB-20) — A disposable replica-set environment passes buyer/seller/staff end-to-end journeys, existing backend criteria, frontend tests/build and privacy checks; every task PR and new commit has the sole authorized author; remaining provider credentials and manual sandbox checks are explicitly reported. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.
- [ ] `AC-NFR-USA-02-1` (NFR-USA-02) — The user interface works from 360 px to 1920 px wide. Verify with: manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.
- [ ] `AC-NFR-COMP-01-1` (NFR-COMP-01) — Current Chrome, Firefox, Safari and Edge are supported. Verify with: manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-073/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-073.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
