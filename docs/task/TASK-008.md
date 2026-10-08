---
id: TASK-008
title: Rate limiting for authentication endpoints
execution_status: verifying
relevance: current
depends_on: [TASK-003]
supersedes: []
superseded_by: null
---

# TASK-008 — Rate limiting for authentication endpoints

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `verifying` — Behavioral tests and bounded AST/complexity review recorded; automatic completion remains inconclusive without applicable calibration

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-SEC-05](../requirements/NFR.md#nfr-sec-05--abuse-protection-for-authentication) |
| Acceptance criteria | `AC-NFR-SEC-05-1` |
| Components | `CMP-AUTH` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | — |

## Objective

Authentication endpoints resist brute force and email flooding.

## In scope

- Per IP and per email limits on login, code request, code verification and recovery

## Out of scope

- Global API rate limits

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-003 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/common/middlewares/rate-limit.middleware.js`

## Invariants and constraints

- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NFR-SEC-05-1` (NFR-SEC-05) — Login, code requests, code verification and password recovery are rate limited (default 5 per minute per IP and email) and return 429 when exceeded. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-008/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-008.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
