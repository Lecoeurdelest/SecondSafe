---
id: TASK-005
title: JWT authentication middleware and role guards
execution_status: todo
relevance: current
depends_on: [TASK-003]
supersedes: []
superseded_by: null
---

# TASK-005 — JWT authentication middleware and role guards

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-09](../requirements/FR-AUTH.md#fr-auth-09--role-based-access-control), [NFR-SEC-03](../requirements/NFR.md#nfr-sec-03--token-authentication) |
| Acceptance criteria | `AC-AUTH-09-1`, `AC-AUTH-09-2`, `AC-NFR-SEC-03-1` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/common/middlewares/auth.middleware.js`, `WDP@1cea2b7:backend/src/common/middlewares/role.middleware.js` |

## Objective

Requests are authenticated by JWT and authorized by role.

## In scope

- jwt.util.js
- authenticate and optionalAuthenticate
- requireRole and requireAdmin

## Out of scope

- Suspension logic (TASK-006)
- Token revocation (D-109)

## Inputs and dependencies

- plan.md#4.1 Identity and access
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-003 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/common/utils/jwt.util.js`
- `backend/src/common/middlewares/auth.middleware.js`
- `backend/src/common/middlewares/role.middleware.js`
- `backend/src/common/middlewares/admin.middleware.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-09-1` (FR-AUTH-09) — Protected endpoints return 401 without a valid Bearer token and 403 when the caller role is not allowed. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-09-2` (FR-AUTH-09) — Moderator endpoints accept moderator and admin; admin endpoints accept admin only. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-03-1` (NFR-SEC-03) — REST authentication verifies JWTs signed with JWT_SECRET and enforces the configured expiry. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-005/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-005.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
