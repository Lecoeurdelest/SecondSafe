---
id: TASK-026
title: SePay top-up and payment notifications
execution_status: todo
relevance: current
depends_on: [TASK-010, TASK-024]
supersedes: []
superseded_by: null
---

# TASK-026 — SePay top-up and payment notifications

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-PAY-03](../requirements/FR-PAY.md#fr-pay-03--top-up-through-sepay), [NFR-SEC-06](../requirements/NFR.md#nfr-sec-06--payment-webhook-security), [NFR-REL-02](../requirements/NFR.md#nfr-rel-02--idempotent-financial-operations), [NFR-INT-01](../requirements/NFR.md#nfr-int-01--resilient-integrations) |
| Acceptance criteria | `AC-PAY-03-1`, `AC-PAY-03-2`, `AC-PAY-03-3`, `AC-NFR-SEC-06-1`, `AC-NFR-REL-02-2`, `AC-NFR-INT-01-2` |
| Components | `CMP-WALLET` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | `WDP@1cea2b7:backend/src/modules/payments/sepay.service.js`, `WDP@1cea2b7:backend/src/modules/payments/sepay.controller.js` |

## Objective

Users top up through SePay and notifications credit wallets safely.

## In scope

- Create payment, IPN, return; order payment creation hook used by TASK-032

## Out of scope

- VNPay

## Inputs and dependencies

- plan.md#4.6 Wallet, payments and escrow
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- docs/technical/order-lifecycle.md
- TASK-010 evidence
- TASK-024 evidence

## Technical approach

Mount SePay routes once; the IPN handler is idempotent on the invoice number.

## Files and symbols

- `backend/src/modules/payments/sepay.*.js`
- `backend/src/modules/payments/payment.route.js`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-PAY-03-1` (FR-PAY-03) — Top-up amounts must be integer VND within the configured bounds (default 10,000–500,000,000); other amounts return 400. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-PAY-03-2` (FR-PAY-03) — Payment notifications are authenticated by the secret header using a constant-time comparison; only ORDER_PAID events whose amount matches the pending transaction are processed. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-PAY-03-3` (FR-PAY-03) — Each invoice credits the wallet at most once. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-06-1` (NFR-SEC-06) — Webhook secrets are never logged and are accepted only from headers. Verify with: static flow review; `cd backend && npm test`.
- [ ] `AC-NFR-REL-02-2` (NFR-REL-02) — Repeating a payment notification has no additional effect. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-INT-01-2` (NFR-INT-01) — Payment gateway calls have timeouts and mapped errors. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-026/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-026.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
