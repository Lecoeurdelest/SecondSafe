---
id: TASK-014
title: Password change and recovery
execution_status: todo
relevance: current
depends_on: [TASK-007, TASK-008, TASK-010, TASK-012]
supersedes: []
superseded_by: null
---

# TASK-014 — Password change and recovery

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-05](../requirements/FR-AUTH.md#fr-auth-05--recover-a-forgotten-password), [FR-AUTH-06](../requirements/FR-AUTH.md#fr-auth-06--reset-the-password-with-a-verified-credential), [FR-AUTH-07](../requirements/FR-AUTH.md#fr-auth-07--change-password), [NFR-SEC-02](../requirements/NFR.md#nfr-sec-02--one-strong-password-policy), [NFR-SEC-10](../requirements/NFR.md#nfr-sec-10--no-account-enumeration) |
| Acceptance criteria | `AC-AUTH-05-1`, `AC-AUTH-05-2`, `AC-AUTH-05-3`, `AC-AUTH-06-1`, `AC-AUTH-07-1`, `AC-AUTH-07-2`, `AC-AUTH-07-3`, `AC-NFR-SEC-02-3`, `AC-NFR-SEC-10-2` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/modules/auth/auth.service.js` |

## Objective

Users change and recover passwords without letting others take over or lock their account.

## In scope

- change-password (one handler for both paths)
- forgot-password and reset-password with a verified one-time credential

## Out of scope

- Temporary-password emails (baseline behavior is replaced)

## Inputs and dependencies

- plan.md#4.1 Identity and access
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-007 evidence
- TASK-008 evidence
- TASK-010 evidence
- TASK-012 evidence

## Technical approach

Default mechanism: emailed one-time code from the code store, exchanged for a reset credential valid at most 1 hour.

## Files and symbols

- `backend/src/modules/auth/`
- `backend/src/modules/users/`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-05-1` (FR-AUTH-05) — POST /api/auth/forgot-password returns the same response whether or not the email is registered. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-05-2` (FR-AUTH-05) — The stored password hash does not change until the requester proves control of the email with an expiring one-time code or signed reset credential (lifetime at most 1 hour). Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-05-3` (FR-AUTH-05) — After a successful reset, a security notification is created for the account. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-06-1` (FR-AUTH-06) — POST /api/auth/reset-password accepts only a valid, unexpired, unused credential issued by the recovery flow and sets a password that satisfies the strong policy. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-07-1` (FR-AUTH-07) — A wrong current password returns 400 and leaves the stored hash unchanged. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-07-2` (FR-AUTH-07) — The new password must satisfy the strong password policy. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-07-3` (FR-AUTH-07) — Both baseline paths are served by one handler. Verify with: static flow review; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-02-3` (NFR-SEC-02) — Password change and reset use the shared policy. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-10-2` (NFR-SEC-10) — Password recovery responses do not reveal whether an account exists. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-014/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-014.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
