---
id: TASK-024
title: Wallet ledger
execution_status: todo
relevance: current
depends_on: [TASK-004, TASK-005]
supersedes: []
superseded_by: null
---

# TASK-024 — Wallet ledger

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PAY-01](../requirements/FR-PAY.md#fr-pay-01--view-wallet), [FR-PAY-02](../requirements/FR-PAY.md#fr-pay-02--transaction-history) |
| Acceptance criteria | `AC-PAY-01-1`, `AC-PAY-02-1` |
| Components | `CMP-WALLET` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/payments/wallet.service.js` |

## Objective

Every balance change is recorded in the ledger with balance before and after.

## In scope

- Wallet creation, balance, transactions, increment/decrement with optimistic retry

## Out of scope

- Gateways

## Inputs and dependencies

- plan.md#4.6 Wallet, payments and escrow
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-004 evidence
- TASK-005 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/wallet.*.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-PAY-01-1` (FR-PAY-01) — A wallet is created on first access and returns balance, available withdrawal balance (balance minus pending withdrawals) and lifetime totals. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PAY-02-1` (FR-PAY-02) — Transactions are paginated, filterable by type and status, and include balance before and after. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-024/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-024.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
