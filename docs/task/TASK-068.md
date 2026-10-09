---
id: TASK-068
title: Web moderator report, order and review queues
execution_status: todo
relevance: current
depends_on: [TASK-067, TASK-040, TASK-041]
supersedes: []
superseded_by: null
---

# TASK-068 — Web moderator report, order and review queues

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-WEB-15](../requirements/FR-WEB.md#fr-web-15--web-moderator-report-order-and-review-queues) |
| Acceptance criteria | `AC-WEB-15-1` |
| Components | `CMP-WEB` |
| Decisions | `D-009` (accepted), `D-010` (accepted), `D-011` (accepted) |
| Milestone | M7 Web client |
| Baseline references | `WDP@1cea2b7:frontend/src/modules/moderator/reports/`, `WDP@1cea2b7:frontend/src/modules/moderator/orders/`, `WDP@1cea2b7:frontend/src/modules/moderator/reviews/` |

## Objective

Staff search and paginate report/order/review queues, inspect authorized details and execute only server-permitted sanctions or lifecycle actions with validation and refreshed results.

## In scope

- frontend/src/modules/moderator/reports/
- frontend/src/modules/moderator/orders/
- frontend/src/modules/moderator/reviews/
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
- TASK-067 evidence
- TASK-040 evidence
- TASK-041 evidence

## Technical approach

Adapt only the assigned WDP paths at 1cea2b7; retain Vietnamese product copy and the existing API prefixes. Keep tasks below five estimated hours where practical; integration and staff queues may require splitting after inspection. Backend integration evidence is required before marking a feature task done.

## Files and symbols

- `frontend/src/modules/moderator/reports/`
- `frontend/src/modules/moderator/orders/`
- `frontend/src/modules/moderator/reviews/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-06` — Passwords exist only as bcrypt hashes and never leave the service.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-WEB-15-1` (FR-WEB-15) — Staff search and paginate report/order/review queues, inspect authorized details and execute only server-permitted sanctions or lifecycle actions with validation and refreshed results. Verify with: behavioral test, manual review; `cd frontend && npm test -- --watchAll=false --runInBand`, `cd frontend && npm run build`.

## Required evidence

- Original runner output under `.project/evidence/TASK-068/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-068.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
