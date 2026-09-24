---
id: TASK-025
title: Escrow service
execution_status: todo
relevance: current
depends_on: [TASK-024]
supersedes: []
superseded_by: null
---

# TASK-025 — Escrow service

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-ORD-12](../requirements/FR-ORD.md#fr-ord-12--platform-fee), [FR-PAY-07](../requirements/FR-PAY.md#fr-pay-07--escrow), [NFR-REL-01](../requirements/NFR.md#nfr-rel-01--atomic-money-and-order-changes), [NFR-REL-02](../requirements/NFR.md#nfr-rel-02--idempotent-financial-operations) |
| Acceptance criteria | `AC-ORD-12-1`, `AC-PAY-07-1`, `AC-PAY-07-2`, `AC-NFR-REL-01-1`, `AC-NFR-REL-02-1` |
| Components | `CMP-WALLET` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/payments/escrow.service.js` |

## Objective

Order funds are held, released or refunded exactly once.

## In scope

- holdFunds, releaseFunds, refundFunds, platform fee

## Out of scope

- Partial refund (TASK-043)

## Inputs and dependencies

- plan.md#4.5 Orders
- plan.md#4.6 Wallet, payments and escrow
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-024 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/escrow.service.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-ORD-12-1` (FR-ORD-12) — The fee equals round(agreedAmount × fee rate) with the rate read from configuration (default 5%); the buyer pays agreedAmount, the seller receives agreedAmount minus the fee, and the fee is recorded as a fee transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-PAY-07-1` (FR-PAY-07) — An escrow hold moves from held to released or refunded, and each transition happens at most once. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-PAY-07-2` (FR-PAY-07) — A refund returns the full totalToPay to the buyer and a release credits the seller payout. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-01-1` (NFR-REL-01) — Escrow hold, release and refund update wallet, transaction and escrow documents in one MongoDB transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-02-1` (NFR-REL-02) — Repeating an escrow release or refund has no additional effect. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-025/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-025.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
