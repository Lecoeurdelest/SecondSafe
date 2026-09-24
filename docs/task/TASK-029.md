---
id: TASK-029
title: Withdrawal approval
execution_status: blocked
relevance: current
depends_on: [TASK-010, TASK-028]
supersedes: []
superseded_by: null
---

# TASK-029 — Withdrawal approval

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-105 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PAY-06](../requirements/FR-PAY.md#fr-pay-06--approve-or-reject-withdrawals) |
| Acceptance criteria | `AC-PAY-06-1`, `AC-PAY-06-2` |
| Components | `CMP-WALLET`, `CMP-MODERATION` |
| Decisions | `D-105` (proposed) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

One approval flow settles pending withdrawals.

## In scope

- List pending, approve, reject for the role chosen in D-105

## Out of scope

- Bank transfer automation

## Inputs and dependencies

- plan.md#4.6 Wallet, payments and escrow
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-010 evidence
- TASK-028 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/`
- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-PAY-06-1` (FR-PAY-06) — A single approval flow exists, owned by the role chosen in decision D-105. Verify with: static flow review; `cd backend && npm test`.
- [ ] `AC-PAY-06-2` (FR-PAY-06) — Only pending withdrawals can be processed; approval debits the wallet and completes the request, and rejection records the reason without a debit. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-029/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-029.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
