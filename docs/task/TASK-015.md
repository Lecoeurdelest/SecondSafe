---
id: TASK-015
title: Optional two-factor login
execution_status: blocked
relevance: current
depends_on: [TASK-007, TASK-012]
supersedes: []
superseded_by: null
---

# TASK-015 — Optional two-factor login

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-101 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-04](../requirements/FR-AUTH.md#fr-auth-04--two-factor-login-optional) |
| Acceptance criteria | `AC-AUTH-04-1`, `AC-AUTH-04-2` |
| Components | `CMP-AUTH` |
| Decisions | `D-101` (proposed) |
| Milestone | M1 Platform and identity |
| Baseline references | — |

## Objective

Users who enable it must confirm login with an emailed code.

## In scope

- Per-user flag, login branch, verify-2fa endpoint

## Out of scope

- Authenticator apps

## Inputs and dependencies

- plan.md#4.1 Identity and access
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-007 evidence
- TASK-012 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/auth/`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-04-1` (FR-AUTH-04) — For a user with two-factor login enabled, a correct password returns requires2FA and emails a 6-digit code instead of a token. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-04-2` (FR-AUTH-04) — POST /api/auth/login/verify-2fa issues the token only for a valid, unexpired code with purpose login_2fa. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-015/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-015.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- D-101 is rejected: retire FR-AUTH-04 and this task instead of implementing it

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
