---
id: TASK-011
title: Registration with email verification
execution_status: todo
relevance: current
depends_on: [TASK-007, TASK-008]
supersedes: []
superseded_by: null
---

# TASK-011 — Registration with email verification

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-01](../requirements/FR-AUTH.md#fr-auth-01--register-with-email-verification), [NFR-SEC-01](../requirements/NFR.md#nfr-sec-01--password-storage), [NFR-SEC-02](../requirements/NFR.md#nfr-sec-02--one-strong-password-policy) |
| Acceptance criteria | `AC-AUTH-01-1`, `AC-AUTH-01-2`, `AC-AUTH-01-3`, `AC-AUTH-01-4`, `AC-NFR-SEC-01-1`, `AC-NFR-SEC-02-1` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/modules/auth/auth.controller.js` |

## Objective

Visitors create accounts only after verifying their email.

## In scope

- request-otp and verify endpoints
- Shared strong password validator

## Out of scope

- Google sign-in

## Inputs and dependencies

- plan.md#4.1 Identity and access
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-007 evidence
- TASK-008 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/auth/`
- `backend/src/common/validators/password.validator.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-01-1` (FR-AUTH-01) — Registration code requests without email, password, full name or phone, with a malformed email, with a phone not matching ^0\d{9,10}$, or with an email or phone already registered are rejected with 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-01-2` (FR-AUTH-01) — The password must satisfy the strong password policy (NFR-SEC-02) before a code is sent. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-01-3` (FR-AUTH-01) — A 6-digit code is emailed, expires after the configured OTP lifetime (default 5 minutes) and can be used once. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-01-4` (FR-AUTH-01) — The account (role user, bcrypt-hashed password) is created only when the submitted code matches; no user document exists before verification. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-01-1` (NFR-SEC-01) — Passwords are stored only as bcrypt hashes with cost at least 10. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-02-1` (NFR-SEC-02) — Registration uses the shared policy: at least 8 characters with upper case, lower case, digit and special character. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-011/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-011.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
