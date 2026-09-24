---
id: TASK-044
title: Admin user management
execution_status: todo
relevance: current
depends_on: [TASK-005, TASK-006]
supersedes: []
superseded_by: null
---

# TASK-044 — Admin user management

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ADM-02](../requirements/FR-ADM.md#fr-adm-02--find-users), [FR-ADM-03](../requirements/FR-ADM.md#fr-adm-03--create-accounts), [FR-ADM-04](../requirements/FR-ADM.md#fr-adm-04--update-users), [FR-ADM-05](../requirements/FR-ADM.md#fr-adm-05--delete-users), [NFR-SEC-02](../requirements/NFR.md#nfr-sec-02--one-strong-password-policy), [NFR-SEC-12](../requirements/NFR.md#nfr-sec-12--safe-regular-expressions) |
| Acceptance criteria | `AC-ADM-02-1`, `AC-ADM-03-1`, `AC-ADM-04-1`, `AC-ADM-05-1`, `AC-NFR-SEC-02-2`, `AC-NFR-SEC-12-2` |
| Components | `CMP-ADMIN` |
| Decisions | `D-001` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | — |

## Objective

Admins find, create, update and delete accounts safely.

## In scope

- Admin list/detail/create/update/delete

## Out of scope

- Restrictions and locks (TASK-045)

## Inputs and dependencies

- plan.md#4.12 Administration
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-005 evidence
- TASK-006 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/users/`

## Invariants and constraints

- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-ADM-02-1` (FR-ADM-02) — Admins search users (escaped input), filter by role and status, paginate (maximum 100) and open user detail. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-03-1` (FR-ADM-03) — Admins create accounts, including moderators, with a unique email and a password that satisfies the strong policy. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-04-1` (FR-ADM-04) — Admins update only full name, phone, address, role and suspension flag, and cannot restrict another admin. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-ADM-05-1` (FR-ADM-05) — Deletion is refused for admins and for users with active orders, any order history or pending transactions. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-02-2` (NFR-SEC-02) — Admin account creation uses the shared policy. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-12-2` (NFR-SEC-12) — Admin user search escapes user input before building a regular expression. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-044/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-044.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
