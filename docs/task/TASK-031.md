---
id: TASK-031
title: Price offers in chat
execution_status: todo
relevance: current
depends_on: [TASK-022, TASK-030]
supersedes: []
superseded_by: null
---

# TASK-031 — Price offers in chat

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-CHAT-05](../requirements/FR-CHAT.md#fr-chat-05--price-offers-in-chat) |
| Acceptance criteria | `AC-CHAT-05-1`, `AC-CHAT-05-2` |
| Components | `CMP-CHAT`, `CMP-ORDERS` |
| Decisions | `D-001` (accepted) |
| Milestone | M3 Money and orders |
| Baseline references | — |

## Objective

Either side can make a price offer inside a conversation.

## In scope

- seller-offer, buyer-offer

## Out of scope

- Counter-offer chains

## Inputs and dependencies

- plan.md#4.4 Chat and negotiation
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-022 evidence
- TASK-030 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/orders/`
- `backend/src/modules/chat/`

## Invariants and constraints

- `INV-01` — Money is never created or lost: every balance change writes a transaction with balance before and after, and each escrow hold is released or refunded at most once.
- `INV-02` — A listing has at most one active order and is reserved while that order is open.
- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.
- `INV-07` — Order status changes only along the documented lifecycle edges.
- `INV-08` — All amounts are integer VND.

## Acceptance criteria and verification

- [ ] `AC-CHAT-05-1` (FR-CHAT-05) — A seller offer can be sent only by the conversation's unrestricted seller and a buyer offer only by its buyer; the price must be positive and the listing available. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-05-2` (FR-CHAT-05) — Each side has at most one pending offer per conversation, and an offer is stored as a message of type offer. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-031/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-031.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
