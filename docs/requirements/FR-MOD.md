# FR-MOD — Moderation

Generated from `project.yaml`. Edit the model, not this file.

### FR-MOD-01 — Moderator dashboard

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/dashboard`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-01-1` | The dashboard returns counts of pending and reviewing reports, pending withdrawals, unreviewed reviews, open orders, suspended users and open disputes, plus the five latest reports. | behavioral test | [TASK-039](../task/TASK-039.md) `[]` |

### FR-MOD-02 — Moderate violation reports

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/reports`, `GET /api/moderator/reports/:reportId`, `PUT /api/moderator/reports/:reportId/resolve`, `PUT /api/reports/:reportId/resolve`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-02-1` | Moderators list, filter and open reports with reporter and target violation statistics. | behavioral test | [TASK-040](../task/TASK-040.md) `[]` |
| `AC-MOD-02-2` | Resolution sets status resolved or dismissed with decision remove_content, warn_user, ban_user or reply_feedback; dismissal allows only reply_feedback, remove_content applies only to listing reports, and processed reports cannot be resolved again. | behavioral test | [TASK-040](../task/TASK-040.md) `[]` |
| `AC-MOD-02-3` | Resolution notifies the reporter and the reported user, and both baseline resolve paths share one handler. | behavioral test | [TASK-040](../task/TASK-040.md) `[]` |

### FR-MOD-03 — Apply sanctions

Risk: `critical` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `report.service.js resolveReport, getReportWarningPenalty`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-03-1` | warn_user increments the violation count and applies a selling restriction of 24 hours, 1 week or 1 year at 3, 6 and 9 warnings. | static flow review, behavioral test | [TASK-040](../task/TASK-040.md) `[]` |
| `AC-MOD-03-2` | A listing with three resolved warn_user reports is removed, remove_content removes the listing, ban_user applies an indefinite selling restriction, and admins are never sanctioned. | static flow review, behavioral test | [TASK-040](../task/TASK-040.md) `[]` |

### FR-MOD-04 — Moderate orders

Risk: `critical` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/orders`, `GET /api/moderator/orders/:id`, `PATCH /api/moderator/orders/:id/status`, `POST /api/moderator/orders/:id/force-cancel`, `GET /api/orders/moderator/all`, `POST /api/orders/moderator/:id/force-cancel`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-04-1` | Moderators list, filter and open orders. | behavioral test | [TASK-041](../task/TASK-041.md) `[]` |
| `AC-MOD-04-2` | Status changes follow the moderator transition matrix, cancellation requires a note of at least 10 characters, completed orders cannot be force-cancelled, and money effects run through the escrow service. | static flow review, behavioral test | [TASK-041](../task/TASK-041.md) `[]` |

### FR-MOD-05 — Moderate reviews

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/reviews`, `PATCH /api/moderator/reviews/:reviewId/hide`, `PATCH /api/moderator/reviews/:reviewId/mark-bad`, `PATCH /api/moderator/reviews/:reviewId/mark-good`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-05-1` | Moderators can hide reviews and mark each review good or bad once; reviews of 4 stars or more are approved automatically. | behavioral test | [TASK-041](../task/TASK-041.md) `[]` |
| `AC-MOD-05-2` | Marking a review bad increments the seller's bad-review count and applies a selling restriction of 24 hours, 1 week or 1 year at 3, 6 and 9. | behavioral test | [TASK-041](../task/TASK-041.md) `[]` |

### FR-MOD-06 — Resolve disputes

Risk: `critical` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/disputes`, `GET /api/moderator/disputes/:disputeId`, `PATCH /api/moderator/disputes/:disputeId/investigating`, `POST /api/moderator/disputes/:disputeId/message`, `PUT /api/moderator/disputes/:disputeId/resolve`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-06-1` | Disputes move pending to investigating to resolved, and moderators can post in the dispute conversation. | behavioral test | [TASK-042](../task/TASK-042.md) `[]` |
| `AC-MOD-06-2` | Refund returns escrow to the buyer; release pays the seller, completes the order and marks the listing sold; a resolved dispute cannot be resolved again. | static flow review, behavioral test | [TASK-042](../task/TASK-042.md) `[]` |
| `AC-MOD-06-3` | A party reaching 3 dispute violations receives a 30-day selling restriction. | behavioral test | [TASK-042](../task/TASK-042.md) `[]` |

### FR-MOD-07 — Suspend a user

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `POST /api/moderator/users/:id/ban`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-07-1` | A moderator can suspend a non-admin user with a reason. | behavioral test | [TASK-040](../task/TASK-040.md) `[]` |

### FR-MOD-08 — Revenue report

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/moderator/revenue-report`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-08-1` | The revenue report covers a date range (default the last 12 months), grouped by month over completed orders. | behavioral test | [TASK-039](../task/TASK-039.md) `[]` |

### FR-MOD-09 — Moderator profile

Risk: `standard` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `GET /api/users/profile`, `PUT /api/users/profile`, `POST /api/users/change-password`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-09-1` | Moderators view and update their own profile and change their password through the profile endpoints. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |

### FR-MOD-10 — Partial refund in dispute resolution

Risk: `critical` · Component: `CMP-MODERATION` · Source: `plan.md` § 4.11 Moderation

Baseline: `dispute.model.js resolution partial_refund, refundAmount`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-MOD-10-1` | A partial_refund resolution returns refundAmount (0 < refundAmount < totalToPay) to the buyer and releases the remainder to the seller in one transaction. | static flow review, behavioral test | [TASK-043](../task/TASK-043.md) `[!]` |
