# FR-NOTI — Notifications

Generated from `project.yaml`. Edit the model, not this file.

### FR-NOTI-01 — Create and push notifications

Risk: `standard` · Component: `CMP-NOTIFY` · Source: `plan.md` § 4.10 Notifications

Baseline: `notification.service.js`, `chat.socket.js emitToUser`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NOTI-01-1` | Notifications are stored with a type from the allowed list and links to the related order, listing, dispute, report or review. | behavioral test | [TASK-010](../task/TASK-010.md) `[]` |
| `AC-NOTI-01-2` | New notifications are pushed as new_notification to every connected socket of the recipient. | behavioral test | [TASK-023](../task/TASK-023.md) `[]` |

### FR-NOTI-02 — Read notifications

Risk: `standard` · Component: `CMP-NOTIFY` · Source: `plan.md` § 4.10 Notifications

Baseline: `GET /api/notifications/unread`, `GET /api/notifications/unread-count`, `GET /api/notifications`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NOTI-02-1` | Unread notifications, the unread count and the paginated history are scoped to the caller. | behavioral test | [TASK-010](../task/TASK-010.md) `[]` |

### FR-NOTI-03 — Mark notifications read

Risk: `standard` · Component: `CMP-NOTIFY` · Source: `plan.md` § 4.10 Notifications

Baseline: `POST /api/notifications/:notificationId/read`, `POST /api/notifications/mark-all-read`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NOTI-03-1` | A user can mark one of their own notifications, or all of them, as read. | behavioral test | [TASK-010](../task/TASK-010.md) `[]` |

### FR-NOTI-04 — Transactional email

Risk: `standard` · Component: `CMP-NOTIFY` · Source: `plan.md` § 4.10 Notifications

Baseline: `email.util.js`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-NOTI-04-1` | Registration, two-factor and recovery emails are sent through the configured SMTP account; delivery failures return 5xx without exposing SMTP details. | behavioral test | [TASK-007](../task/TASK-007.md) `[!]` |
