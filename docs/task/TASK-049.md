---
id: TASK-049
title: Authorization, privacy and coverage gates
execution_status: todo
relevance: current
depends_on: [TASK-016, TASK-022, TASK-029, TASK-034, TASK-035, TASK-036, TASK-037, TASK-042, TASK-045]
supersedes: []
superseded_by: null
---

# TASK-049 — Authorization, privacy and coverage gates

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-SEC-01](../requirements/NFR.md#nfr-sec-01--password-storage), [NFR-SEC-04](../requirements/NFR.md#nfr-sec-04--object-level-authorization), [NFR-DATA-01](../requirements/NFR.md#nfr-data-01--personal-data-protection), [NFR-MNT-03](../requirements/NFR.md#nfr-mnt-03--automated-tests-and-coverage) |
| Acceptance criteria | `AC-NFR-SEC-01-2`, `AC-NFR-SEC-04-1`, `AC-NFR-DATA-01-1`, `AC-NFR-MNT-03-1` |
| Components | `CMP-PLATFORM`, `CMP-CONTROL` |
| Decisions | `D-001` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Cross-cutting tests prove object-level authorization, data minimisation and coverage.

## In scope

- Non-party access tests for every protected resource
- Response field allow-lists
- Coverage thresholds in jest config

## Out of scope

- Penetration testing

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-016 evidence
- TASK-022 evidence
- TASK-029 evidence
- TASK-034 evidence
- TASK-035 evidence
- TASK-036 evidence
- TASK-037 evidence
- TASK-042 evidence
- TASK-045 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/tests/security/`
- `backend/package.json`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NFR-SEC-01-2` (NFR-SEC-01) — No API response contains a password or password hash field. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-04-1` (NFR-SEC-04) — Automated tests cover every endpoint that reads or writes another user's orders, deliveries, disputes, reports, conversations, reviews or wallet data, and each returns 403 or 404 to non-parties. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-DATA-01-1` (NFR-DATA-01) — Public and non-party responses exclude email, phone, address and bank data. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-MNT-03-1` (NFR-MNT-03) — Service-layer line coverage is at least 60% for orders, escrow, wallet and disputes, enforced by the test command. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-049/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-049.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
