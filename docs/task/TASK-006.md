---
id: TASK-006
title: Account suspension and selling-restriction service
execution_status: todo
relevance: current
depends_on: [TASK-005]
supersedes: []
superseded_by: null
---

# TASK-006 — Account suspension and selling-restriction service

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-AUTH-10](../requirements/FR-AUTH.md#fr-auth-10--enforce-suspension-and-selling-restriction-on-every-request), [NFR-PERF-05](../requirements/NFR.md#nfr-perf-05--lightweight-authentication-checks) |
| Acceptance criteria | `AC-AUTH-10-1`, `AC-AUTH-10-2`, `AC-AUTH-10-3`, `AC-NFR-PERF-05-1` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | `WDP@1cea2b7:backend/src/common/utils/seller-restriction.util.js`, `WDP@1cea2b7:backend/src/common/middlewares/auth.middleware.js` |

## Objective

One service decides suspension and selling restriction for every entry point.

## In scope

- Suspension check with automatic expiry
- Selling restriction apply/refresh/clear, hiding active listings once per state change
- requireSellerCanSell middleware

## Out of scope

- Sanction thresholds (TASK-040, TASK-041)

## Inputs and dependencies

- plan.md#4.1 Identity and access
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-005 evidence

## Technical approach

Replace the four copied baseline blocks with one function; do not write to the database for unrestricted users.

## Files and symbols

- `backend/src/common/utils/seller-restriction.util.js`
- `backend/src/common/middlewares/seller-restriction.middleware.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-AUTH-10-1` (FR-AUTH-10) — An authenticated request from a suspended account returns 403 until the suspension ends; expired suspensions are lifted automatically. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-10-2` (FR-AUTH-10) — While a selling restriction is active, the seller's active listings are hidden and seller actions return 403; an expired restriction is cleared automatically. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-AUTH-10-3` (FR-AUTH-10) — Suspension and restriction rules live in one shared service used by login, Google sign-in and the authentication middleware. Verify with: static flow review; `cd backend && npm test`.
- [ ] `AC-NFR-PERF-05-1` (NFR-PERF-05) — Authentication performs no database writes for unrestricted users, and restriction side effects run once per state change. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-006/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-006.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
