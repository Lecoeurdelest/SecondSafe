---
id: TASK-022
title: Conversations and messages
execution_status: todo
relevance: current
depends_on: [TASK-005, TASK-009, TASK-018]
supersedes: []
superseded_by: null
---

# TASK-022 — Conversations and messages

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-CHAT-01](../requirements/FR-CHAT.md#fr-chat-01--open-a-conversation), [FR-CHAT-02](../requirements/FR-CHAT.md#fr-chat-02--real-time-messaging), [FR-CHAT-03](../requirements/FR-CHAT.md#fr-chat-03--send-images-in-chat), [FR-CHAT-04](../requirements/FR-CHAT.md#fr-chat-04--conversation-list-and-history), [NFR-SEC-07](../requirements/NFR.md#nfr-sec-07--chat-encryption-at-rest) |
| Acceptance criteria | `AC-CHAT-01-1`, `AC-CHAT-01-2`, `AC-CHAT-02-3`, `AC-CHAT-03-1`, `AC-CHAT-04-1`, `AC-CHAT-04-2`, `AC-NFR-SEC-07-1` |
| Components | `CMP-CHAT` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | `WDP@1cea2b7:backend/src/modules/chat/chat.service.js`, `WDP@1cea2b7:backend/src/common/utils/chat-crypto.util.js` |

## Objective

Buyers and sellers exchange encrypted messages about a listing or order.

## In scope

- Conversation REST endpoints, message history, REST send, image upload
- Require CHAT_ENCRYPTION_KEY (remove the JWT_SECRET fallback in config/env.js) for the carried-over AES-256-GCM helper

## Out of scope

- Socket transport (TASK-023)

## Inputs and dependencies

- plan.md#4.4 Chat and negotiation
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-005 evidence
- TASK-009 evidence
- TASK-018 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/chat/`
- `backend/src/config/env.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.

## Acceptance criteria and verification

- [ ] `AC-CHAT-01-1` (FR-CHAT-01) — Opening a conversation returns the existing one for (buyer, seller, listing) or creates it; a user cannot open a conversation with themselves. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-01-2` (FR-CHAT-01) — An order-based conversation can be opened only by the order's buyer or seller. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-02-3` (FR-CHAT-02) — POST /api/chat/messages provides the same send behavior over REST. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-03-1` (FR-CHAT-03) — Only conversation participants can upload chat images (image formats, ≤20 MB), and the stored path is returned. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-04-1` (FR-CHAT-04) — Conversations are sorted by last message time with a separate unread count for each side. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-04-2` (FR-CHAT-04) — Message history is paginated; reading a conversation marks its messages read and resets the caller's unread count. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-07-1` (NFR-SEC-07) — Chat content is stored with AES-256-GCM using the required CHAT_ENCRYPTION_KEY (no fallback to JWT_SECRET), and legacy plaintext messages remain readable. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-022/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-022.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
