# FR-CHAT — Chat and negotiation

Generated from `project.yaml`. Edit the model, not this file.

### FR-CHAT-01 — Open a conversation

Risk: `standard` · Component: `CMP-CHAT` · Source: `plan.md` § 4.4 Chat and negotiation

Baseline: `POST /api/chat/conversations`, `POST /api/chat/orders/:orderId/conversation`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-CHAT-01-1` | Opening a conversation returns the existing one for (buyer, seller, listing) or creates it; a user cannot open a conversation with themselves. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |
| `AC-CHAT-01-2` | An order-based conversation can be opened only by the order's buyer or seller. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |

### FR-CHAT-02 — Real-time messaging

Risk: `standard` · Component: `CMP-CHAT` · Source: `plan.md` § 4.4 Chat and negotiation

Baseline: `Socket.IO chat.socket.js`, `POST /api/chat/messages`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-CHAT-02-1` | Socket connections require a valid JWT and a user can join only conversations they belong to. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |
| `AC-CHAT-02-2` | send_message persists the message (≤1000 characters) and broadcasts receive_message; typing, stop_typing, mark_as_read, online and offline events are emitted. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |
| `AC-CHAT-02-3` | POST /api/chat/messages provides the same send behavior over REST. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |

### FR-CHAT-03 — Send images in chat

Risk: `standard` · Component: `CMP-CHAT` · Source: `plan.md` § 4.4 Chat and negotiation

Baseline: `POST /api/chat/messages/upload-image`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-CHAT-03-1` | Only conversation participants can upload chat images (image formats, ≤20 MB), and the stored path is returned. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |

### FR-CHAT-04 — Conversation list and history

Risk: `standard` · Component: `CMP-CHAT` · Source: `plan.md` § 4.4 Chat and negotiation

Baseline: `GET /api/chat/conversations`, `GET /api/chat/conversations/:id`, `GET /api/chat/conversations/:id/messages`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-CHAT-04-1` | Conversations are sorted by last message time with a separate unread count for each side. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |
| `AC-CHAT-04-2` | Message history is paginated; reading a conversation marks its messages read and resets the caller's unread count. | behavioral test | [TASK-022](../task/TASK-022.md) `[]` |

### FR-CHAT-05 — Price offers in chat

Risk: `standard` · Component: `CMP-CHAT` · Source: `plan.md` § 4.4 Chat and negotiation

Baseline: `POST /api/orders/seller-offer`, `POST /api/orders/buyer-offer`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-CHAT-05-1` | A seller offer can be sent only by the conversation's unrestricted seller and a buyer offer only by its buyer; the price must be positive and the listing available. | behavioral test | [TASK-031](../task/TASK-031.md) `[]` |
| `AC-CHAT-05-2` | Each side has at most one pending offer per conversation, and an offer is stored as a message of type offer. | behavioral test | [TASK-031](../task/TASK-031.md) `[]` |
