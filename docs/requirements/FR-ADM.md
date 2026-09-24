# FR-ADM — Administration

Generated from `project.yaml`. Edit the model, not this file.

### FR-ADM-01 — Admin dashboard

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `GET /api/users/admin/dashboard`, `GET /api/users/admin/stats`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-01-1` | Admins see user, order, report and pending-withdrawal statistics. | behavioral test | [TASK-045](../task/TASK-045.md) `[]` |

### FR-ADM-02 — Find users

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `GET /api/users/admin/users`, `GET /api/users/admin/users/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-02-1` | Admins search users (escaped input), filter by role and status, paginate (maximum 100) and open user detail. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |

### FR-ADM-03 — Create accounts

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `POST /api/users/admin/users`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-03-1` | Admins create accounts, including moderators, with a unique email and a password that satisfies the strong policy. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |

### FR-ADM-04 — Update users

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `PUT /api/users/admin/users/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-04-1` | Admins update only full name, phone, address, role and suspension flag, and cannot restrict another admin. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |

### FR-ADM-05 — Delete users

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `DELETE /api/users/admin/users/:id`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-05-1` | Deletion is refused for admins and for users with active orders, any order history or pending transactions. | behavioral test | [TASK-044](../task/TASK-044.md) `[]` |

### FR-ADM-06 — Restrict or restore selling

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `POST /api/users/admin/users/:id/suspend`, `POST /api/users/admin/users/:id/unsuspend`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-06-1` | Admins restrict selling with a duration and reason (default by violation count: 24 hours, 1 week from 6, 1 year from 9) and hide the seller's active listings, or lift the restriction. | behavioral test | [TASK-045](../task/TASK-045.md) `[]` |

### FR-ADM-07 — Lock or unlock moderators

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `POST /api/users/admin/users/:id/lock-account`, `POST /api/users/admin/users/:id/unlock-account`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-07-1` | Lock and unlock apply only to moderators, use the lock endpoints (not selling restriction) and are refused while the moderator has active orders. | behavioral test | [TASK-045](../task/TASK-045.md) `[]` |

### FR-ADM-08 — Admin access to moderation

Risk: `standard` · Component: `CMP-ADMIN` · Source: `plan.md` § 4.12 Administration

Baseline: `/api/moderator/*`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-ADM-08-1` | Admins can use every moderator endpoint. | behavioral test | [TASK-045](../task/TASK-045.md) `[]` |
