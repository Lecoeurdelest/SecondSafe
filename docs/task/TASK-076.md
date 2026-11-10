---
id: TASK-076
title: Web abandoned checkout recovery
execution_status: todo
relevance: current
depends_on: [TASK-063, TASK-075]
supersedes: []
superseded_by: null
---

# TASK-076 — Web abandoned checkout recovery

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-21](../requirements/FR-WEB.md#fr-web-21--web-abandoned-checkout-recovery) |
| Acceptance criteria | `AC-WEB-21-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-011` (accepted) |
| Milestone | M9 Checkout recovery |
| Baseline references | — |

## Objective

Buyers see their unfinished checkouts where they shop and pay, and staff dashboards show the recovery summary.

## In scope

- frontend/src/modules/order/AbandonedCheckouts.jsx
- frontend/src/services/abandonedCheckout.service.js
- frontend/src/modules/dashboard/Dashboard.jsx
- Associated styles and tests; observable loading, empty and failure states

## Out of scope

- Unrelated modules
- Schema or business-rule changes outside an explicit task

## Inputs and dependencies

- plan.md#13. Checkout recovery amendment (2026-11-10)
- docs/technical/abandoned-checkout.md
- docs/technical/gitflow.md
- TASK-063 evidence
- TASK-075 evidence

## Technical approach

Load the checkout list and the summary on their own so a failure never blocks the order list, the cart or the dashboard. Backend integration evidence is required before marking the task done.

## Files and symbols

- `frontend/src/modules/order/AbandonedCheckouts.jsx`
- `frontend/src/modules/order/AbandonedCheckouts.css`
- `frontend/src/services/abandonedCheckout.service.js`
- `frontend/src/modules/dashboard/Dashboard.jsx`
- `frontend/src/routes/index.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-21-1` (FR-WEB-21) — Buyers see their unfinished checkouts above the order list and the cart with resume-payment, buy-again and dismiss actions; admin and staff dashboards show the recovery summary; a failed summary or list request never hides the page it sits on. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-076/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-076.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
