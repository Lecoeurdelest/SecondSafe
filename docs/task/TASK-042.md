---
id: TASK-042
title: Dispute resolution
execution_status: todo
relevance: current
depends_on: [TASK-025, TASK-038]
supersedes: []
superseded_by: null
---

# TASK-042 — Dispute resolution

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-MOD-06](../requirements/FR-MOD.md#fr-mod-06--resolve-disputes) |
| Acceptance criteria | `AC-MOD-06-1`, `AC-MOD-06-2`, `AC-MOD-06-3` |
| Components | `CMP-MODERATION`, `CMP-TRUST` |
| Decisions | `D-001` (accepted) |
| Milestone | M4 Trust and moderation |
| Baseline references | — |

## Objective

Moderators investigate disputes and settle escrow by refund or release.

## In scope

- List, detail, investigating, message, resolve (refund, release), dispute violations

## Out of scope

- Partial refund (TASK-043)

## Inputs and dependencies

- plan.md#4.11 Moderation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-025 evidence
- TASK-038 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/moderator/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-03` — A seller under selling restriction cannot create listings, offers or seller-side orders, and their active listings are hidden.
- `INV-04` — Admin accounts are never suspended, restricted, locked or deleted by platform rules.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-07` — Order status changes only along the documented lifecycle edges.

## Acceptance criteria and verification

- [ ] `AC-MOD-06-1` (FR-MOD-06) — Disputes move pending to investigating to resolved, and moderators can post in the dispute conversation. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-06-2` (FR-MOD-06) — Refund returns escrow to the buyer; release pays the seller, completes the order and marks the listing sold; a resolved dispute cannot be resolved again. Verify with: static flow review, behavioral test; `cd backend && npm test`.
- [ ] `AC-MOD-06-3` (FR-MOD-06) — A party reaching 3 dispute violations receives a 30-day selling restriction. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-042/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-042.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
