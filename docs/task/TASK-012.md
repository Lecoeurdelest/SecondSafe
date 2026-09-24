---
id: TASK-012
title: Login and logout
execution_status: todo
relevance: current
depends_on: [TASK-006, TASK-008]
supersedes: []
superseded_by: null
---

# TASK-012 — Login and logout

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-02](../requirements/FR-AUTH.md#fr-auth-02--log-in-with-email-and-password), [FR-AUTH-08](../requirements/FR-AUTH.md#fr-auth-08--log-out), [NFR-SEC-10](../requirements/NFR.md#nfr-sec-10--no-account-enumeration) |
| Acceptance criteria | `AC-AUTH-02-1`, `AC-AUTH-02-2`, `AC-AUTH-02-3`, `AC-AUTH-08-1`, `AC-NFR-SEC-10-1` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/modules/auth/auth.service.js` |

## Objective

Users log in with email and password without leaking account state.

## In scope

- login and logout endpoints

## Out of scope

- Two-factor login (TASK-015)

## Inputs and dependencies

- plan.md#4.1 Identity and access
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-006 evidence
- TASK-008 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/auth/`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-02-1` (FR-AUTH-02) — Valid credentials return a signed JWT (configured lifetime, default 7 days) and the user profile without the password. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-02-2` (FR-AUTH-02) — An unknown email and a wrong password produce the same 401 response. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-02-3` (FR-AUTH-02) — Suspension state is disclosed only after the password is verified: an active suspension returns 403 with end time and reason; an expired suspension is lifted automatically. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-08-1` (FR-AUTH-08) — POST /api/auth/logout returns 200 for an authenticated user; server-side token handling follows decision D-109 (baseline: the client discards the token). Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-10-1` (NFR-SEC-10) — Login responses do not reveal whether an account exists or is suspended before the password is verified. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-012/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-012.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
