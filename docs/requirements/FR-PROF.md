# FR-PROF — Profiles

Generated from `project.yaml`. Edit the model, not this file.

### FR-PROF-01 — View own profile

Risk: `standard` · Component: `CMP-USERS` · Source: `plan.md` § 4.2 Profiles

Baseline: `GET /api/users/profile`, `GET /api/auth/profile`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROF-01-1` | Both profile paths return the caller's profile from one handler, without the password. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |

### FR-PROF-02 — Update profile

Risk: `standard` · Component: `CMP-USERS` · Source: `plan.md` § 4.2 Profiles

Baseline: `PUT /api/users/profile`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROF-02-1` | Full name must be 2–80 characters, phone must match ^0\d{9,10}$ and be unused by another account, and address must be at most 255 characters; violations return 400. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |
| `AC-PROF-02-2` | Structured location (city, district, ward, specific address) is stored with the profile. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |

### FR-PROF-03 — Update avatar

Risk: `standard` · Component: `CMP-USERS` · Source: `plan.md` § 4.2 Profiles

Baseline: `POST /api/users/avatar`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROF-03-1` | POST /api/users/avatar stores a path produced by the upload pipeline and rejects any other value with 400. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |

### FR-PROF-04 — Public profile and statistics

Risk: `standard` · Component: `CMP-USERS` · Source: `plan.md` § 4.2 Profiles

Baseline: `GET /api/users/:id/public`, `GET /api/users/:id/stats`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-PROF-04-1` | Public profile and statistics are available without authentication and never expose email, phone, address or wallet data. | behavioral test | [TASK-016](../task/TASK-016.md) `[]` |
