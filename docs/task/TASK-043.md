---
id: TASK-043
title: Partial refunds in disputes
execution_status: blocked
relevance: current
depends_on: [TASK-042]
supersedes: []
superseded_by: null
---

# TASK-043 — Partial refunds in disputes

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

**Current state:** `blocked` — Awaiting decision D-106 (proposed)

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-MOD-10](../requirements/FR-MOD.md#fr-mod-10--partial-refund-in-dispute-resolution) |
| Acceptance criteria | `AC-MOD-10-1` |
| Components | `CMP-MODERATION`, `CMP-WALLET` |
| Decisions | `D-106` (proposed) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Moderators can split escrow between buyer and seller.

## In scope

- partial_refund resolution

## Out of scope

- Multi-currency

## Inputs and dependencies

- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-042 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/payments/escrow.service.js`
- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-MOD-10-1` (FR-MOD-10) — A partial_refund resolution returns refundAmount (0 < refundAmount < totalToPay) to the buyer and releases the remainder to the seller in one transaction. Verify with: static flow review, behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-043/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-043.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output
- D-106 is rejected: remove partial_refund from the dispute enum through a schema-change task and retire FR-MOD-10

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
