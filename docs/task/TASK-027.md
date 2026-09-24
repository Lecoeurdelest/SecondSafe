---
id: TASK-027
title: VNPay top-up
execution_status: blocked
relevance: current
depends_on: [TASK-024]
supersedes: []
superseded_by: null
---

# TASK-027 — VNPay top-up

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-102 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PAY-04](../requirements/FR-PAY.md#fr-pay-04--top-up-through-vnpay), [NFR-SEC-06](../requirements/NFR.md#nfr-sec-06--payment-webhook-security) |
| Acceptance criteria | `AC-PAY-04-1`, `AC-NFR-SEC-06-2` |
| Components | `CMP-WALLET` |
| Decisions | `D-102` (proposed) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/payments/vnpay.service.js` |

## Objective

Users top up through VNPay if the gateway is kept.

## In scope

- Create URL, callback, return

## Out of scope

- VNPay order payment

## Inputs and dependencies

- plan.md#4.6 Wallet, payments and escrow
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-024 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/vnpay.*.js`
- `backend/src/config/vnpay.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-PAY-04-1` (FR-PAY-04) — VNPay payment URLs are signed, callbacks and returns are accepted only with a valid HMAC signature, and each payment credits the wallet at most once. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-06-2` (NFR-SEC-06) — VNPay responses are accepted only with a valid signature. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-027/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-027.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- D-102 is rejected: retire FR-PAY-04 and this task

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
