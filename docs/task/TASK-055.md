---
id: TASK-055
title: Web authentication, session and route guards
execution_status: todo
relevance: current
depends_on: [TASK-054, TASK-011, TASK-012, TASK-013, TASK-014]
supersedes: []
superseded_by: null
---

# TASK-055 — Web authentication, session and route guards

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-02](../requirements/FR-WEB.md#fr-web-02--web-authentication-session-and-route-guards) |
| Acceptance criteria | `AC-WEB-02-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M7 Web client |
| Baseline references | `WDP@1cea2b7:frontend/src/modules/auth/`, `WDP@1cea2b7:frontend/src/context/AuthContext.jsx`, `WDP@1cea2b7:frontend/src/hooks/useAuth.js`, `WDP@1cea2b7:frontend/src/routes/`, `WDP@1cea2b7:frontend/src/config/firebase.js`, `WDP@1cea2b7:frontend/src/services/auth.service.js` |

## Objective

Registration, email verification, login, Google sign-in and recovery use the accepted API; session changes update guards; protected and staff routes reject unauthorized users; missing Firebase configuration does not crash the app.

## In scope

- frontend/src/modules/auth/
- frontend/src/context/AuthContext.jsx
- frontend/src/hooks/useAuth.js
- frontend/src/routes/
- frontend/src/config/firebase.js
- frontend/src/services/auth.service.js
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
- TASK-054 evidence
- TASK-011 evidence
- TASK-012 evidence
- TASK-013 evidence
- TASK-014 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/src/modules/auth/`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/hooks/useAuth.js`
- `frontend/src/routes/`
- `frontend/src/config/firebase.js`
- `frontend/src/services/auth.service.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-02-1` (FR-WEB-02) — Registration, email verification, login, Google sign-in and recovery use the accepted API; session changes update guards; protected and staff routes reject unauthorized users; missing Firebase configuration does not crash the app. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-055/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-055.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
