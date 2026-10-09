---
id: TASK-004
title: Business configuration module
execution_status: ready
relevance: current
depends_on: [TASK-001]
supersedes: []
superseded_by: null
---

# TASK-004 — Business configuration module

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `ready` — Dependencies complete; ready to implement and verify

## Traceability

| Field | Value |
|---|---|
| Requirements | [NFR-BIZ-01](../requirements/NFR.md#nfr-biz-01--money-rules-as-configuration), [NFR-BIZ-02](../requirements/NFR.md#nfr-biz-02--time-rules-as-configuration) |
| Acceptance criteria | `AC-NFR-BIZ-01-1`, `AC-NFR-BIZ-02-1` |
| Components | `CMP-PLATFORM` |
| Decisions | `D-001` (accepted) |
| Milestone | M1 Platform and identity |
| Baseline references | — |

## Objective

Money and time rules are read from one configuration module with baseline defaults.

## In scope

- Fee rate, top-up bounds, withdrawal minimum
- OTP, payment, shipping, auto-completion, listing age, reset and JWT windows
- Validation of environment overrides

## Out of scope

- Choosing new values for proposed decisions

## Inputs and dependencies

- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-001 evidence

## Technical approach

Defaults equal the baseline constants listed in plan.md section 7; the payment window default stays 3 minutes until D-104 is accepted.

## Files and symbols

- `backend/src/config/business.js`
- `backend/.env.example`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.

## Acceptance criteria and verification

- [ ] `AC-NFR-BIZ-01-1` (NFR-BIZ-01) — Fee rate, top-up bounds and withdrawal minimum are configuration values with the baseline defaults, and all amounts are integer VND. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-BIZ-02-1` (NFR-BIZ-02) — OTP lifetime, payment window (decision D-104), shipping window, auto-completion window, listing age, reset lifetime and JWT lifetime are configuration values with the baseline defaults. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-004/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-004.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
