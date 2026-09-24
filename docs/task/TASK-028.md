---
id: TASK-028
title: Withdrawal requests
execution_status: todo
relevance: current
depends_on: [TASK-024]
supersedes: []
superseded_by: null
---

# TASK-028 — Withdrawal requests

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PAY-05](../requirements/FR-PAY.md#fr-pay-05--request-a-withdrawal) |
| Acceptance criteria | `AC-PAY-05-1` |
| Components | `CMP-WALLET` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

Users request withdrawals within their available balance.

## In scope

- POST /wallets/withdraw

## Out of scope

- Approval (TASK-029)

## Inputs and dependencies

- plan.md#4.6 Wallet, payments and escrow
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-024 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/wallet.*.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-PAY-05-1` (FR-PAY-05) — A withdrawal needs an integer amount at least the configured minimum (default 50,000 VND) and at most the available balance, a bank account of at least 6 characters, a bank name and an account holder; it is recorded as pending. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-028/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-028.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
