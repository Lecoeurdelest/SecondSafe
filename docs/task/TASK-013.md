---
id: TASK-013
title: Google sign-in
execution_status: todo
relevance: current
depends_on: [TASK-006]
supersedes: []
superseded_by: null
---

# TASK-013 — Google sign-in

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-03](../requirements/FR-AUTH.md#fr-auth-03--sign-in-with-google) |
| Acceptance criteria | `AC-AUTH-03-1`, `AC-AUTH-03-2`, `AC-AUTH-03-3` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/config/firebase.js`, `WDP@1cea2b7:backend/src/modules/auth/auth.service.js` |

## Objective

Users sign in with Google through a server-verified Firebase token.

## In scope

- Firebase Admin initialisation
- google endpoint

## Out of scope

- Client-side Firebase

## Inputs and dependencies

- plan.md#4.1 Identity and access
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-006 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/auth/`
- `backend/src/config/firebase.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-03-1` (FR-AUTH-03) — The Firebase ID token is verified server-side; invalid or expired tokens return 401. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-03-2` (FR-AUTH-03) — A first-time Google email creates a user with role user, a random strong password, and the Google name and avatar. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-03-3` (FR-AUTH-03) — Existing users pass through the same suspension and selling-restriction checks as password login. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-013/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-013.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
