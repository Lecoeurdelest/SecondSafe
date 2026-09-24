---
id: TASK-023
title: Realtime gateway
execution_status: todo
relevance: current
depends_on: [TASK-010, TASK-022]
supersedes: []
superseded_by: null
---

# TASK-023 — Realtime gateway

> Generated from `project.yaml` and `.project/state.json` by `tools/pdd/render.py`. Edit the model, not this file.

## Traceability

| Field | Value |
|---|---|
| Requirements | [FR-CHAT-02](../requirements/FR-CHAT.md#fr-chat-02--real-time-messaging), [FR-NOTI-01](../requirements/FR-NOTI.md#fr-noti-01--create-and-push-notifications), [NFR-SEC-03](../requirements/NFR.md#nfr-sec-03--token-authentication), [NFR-REL-04](../requirements/NFR.md#nfr-rel-04--no-critical-state-in-process-memory), [NFR-USA-03](../requirements/NFR.md#nfr-usa-03--real-time-delivery) |
| Acceptance criteria | `AC-CHAT-02-1`, `AC-CHAT-02-2`, `AC-NOTI-01-2`, `AC-NFR-SEC-03-2`, `AC-NFR-REL-04-2`, `AC-NFR-USA-03-1` |
| Components | `CMP-CHAT`, `CMP-NOTIFY` |
| Decisions | `D-001` (accepted) |
| Milestone | M2 Catalog and chat |
| Baseline references | `WDP@1cea2b7:backend/src/modules/chat/chat.socket.js` |

## Objective

Messages, presence and notifications are delivered in real time to every connected device.

## In scope

- Socket.IO server with JWT handshake
- Rooms, typing, read receipts, presence via store interface
- emitToUser for notifications

## Out of scope

- Horizontal scaling adapter (D-108)

## Inputs and dependencies

- plan.md#4.4 Chat and negotiation
- plan.md#4.10 Notifications
- plan.md#5. Quality requirements
- docs/technical/architecture.md
- docs/technical/data-model.md
- TASK-010 evidence
- TASK-022 evidence

## Technical approach

Follow `docs/technical/architecture.md` layering and the baseline references; keep money changes inside the wallet and escrow services.

## Files and symbols

- `backend/src/modules/chat/chat.socket.js`
- `backend/src/server.js`

## Invariants and constraints

- `INV-05` — Order-scoped data (order, delivery, dispute, conversation, evidence) is visible only to the order parties, moderators and admins.

## Acceptance criteria and verification

- [ ] `AC-CHAT-02-1` (FR-CHAT-02) — Socket connections require a valid JWT and a user can join only conversations they belong to. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-CHAT-02-2` (FR-CHAT-02) — send_message persists the message (≤1000 characters) and broadcasts receive_message; typing, stop_typing, mark_as_read, online and offline events are emitted. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NOTI-01-2` (FR-NOTI-01) — New notifications are pushed as new_notification to every connected socket of the recipient. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-SEC-03-2` (NFR-SEC-03) — Socket.IO connections are authenticated with the same JWT verification. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-REL-04-2` (NFR-REL-04) — Socket presence uses the same store interface. Verify with: behavioral test; `cd backend && npm test`.
- [ ] `AC-NFR-USA-03-1` (NFR-USA-03) — New messages and notifications reach connected recipients within 2 seconds in the integration test environment. Verify with: behavioral test; `cd backend && npm test`.

## Required evidence

- Original runner output under `.project/evidence/TASK-023/<run-id>/` and a `report.json` listing each criterion.
- Implementation record `docs/implement/IMPL-TASK-023.md`.

## Stop conditions

- A required decision is not accepted
- A needed schema change has no approved schema-change task (D-003)
- Verification cannot run or produces no original output

## Completion

1. Run the listed checks and keep their original outputs.
2. Write the implementation record from `docs/implement/IMPL-TEMPLATE.md`.
3. Update `.project/state.json`, then run `python3 tools/pdd/render.py` to refresh markers and views.
