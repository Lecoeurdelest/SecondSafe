---
id: TASK-046
title: Order lifecycle jobs
execution_status: todo
relevance: current
depends_on: [TASK-025, TASK-033]
supersedes: []
superseded_by: null
---

# TASK-046 — Order lifecycle jobs

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-SYS-01](../requirements/FR-SYS.md#fr-sys-01--cancel-orders-past-the-payment-deadline), [FR-SYS-02](../requirements/FR-SYS.md#fr-sys-02--complete-delivered-orders-automatically), [FR-SYS-03](../requirements/FR-SYS.md#fr-sys-03--refund-orders-not-shipped-in-time), [NFR-REL-03](../requirements/NFR.md#nfr-rel-03--reliable-scheduled-jobs) |
| Acceptance criteria | `AC-SYS-01-1`, `AC-SYS-02-1`, `AC-SYS-03-1`, `AC-NFR-REL-03-1` |
| Components | `CMP-JOBS` |
| Decisions | `D-001` (accepted) |
| Milestone | M5 Administration and operations |
| Baseline references | `WDP@1cea2b7:backend/src/services/cron.service.js` |

## Objective

Unpaid, unshipped and delivered orders progress automatically and safely.

## In scope

- Payment timeout, auto-completion, late-shipping refund, job lock

## Out of scope

- Listing expiry (TASK-047)

## Inputs and dependencies

- plan.md#4.13 Scheduled jobs and data operations
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-025 evidence
- TASK-033 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/services/cron.service.js`
- `backend/src/server.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-SYS-01-1` (FR-SYS-01) — A job running every minute cancels orders awaiting payment past their deadline and returns the listing to active. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-SYS-02-1` (FR-SYS-02) — An hourly job completes delivered, undisputed orders older than the configured window (default 5 days) and releases escrow exactly once. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-SYS-03-1` (FR-SYS-03) — An hourly job refunds and cancels paid orders not shipped within the configured window (default 24 hours). Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-03-1` (NFR-REL-03) — A failure on one record does not stop a job, and a lock ensures only one instance runs each job at a time. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-046/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-046.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
