# FR-RPT — Violation reports

Generated from `project.yaml`. Edit the model, not this file.

### FR-RPT-01 — Report a listing

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/reports/product`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-RPT-01-1` | A listing report needs a reason (counterfeit, inappropriate, scam, spam, other) and a 10–1000 character description, with optional evidence. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |
| `AC-RPT-01-2` | A user cannot report their own listing or report the same listing twice. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |

### FR-RPT-02 — Report a user

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/reports/user`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-RPT-02-1` | A user report follows the same validation, targets an existing user, and cannot target the reporter. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |

### FR-RPT-03 — Track my reports

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `GET /api/reports/my-reports`, `GET /api/reports/:reportId`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-RPT-03-1` | A reporter lists their reports with pagination. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |
| `AC-RPT-03-2` | Report detail is visible only to the reporter, moderators and admins; the reported user sees a redacted view without the reporter identity. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |

### FR-RPT-04 — Automatic restriction by report count

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `report.service.js tryAutoSuspendByReportThreshold`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-RPT-04-1` | Reaching the configured threshold (default 3 non-dismissed reports) applies a selling restriction automatically, never to admins. | behavioral test | [TASK-037](../task/TASK-037.md) `[]` |

### FR-RPT-05 — Upload evidence

Risk: `standard` · Component: `CMP-TRUST` · Source: `plan.md` § 4.9 Reports and disputes

Baseline: `POST /api/upload/evidence`

| Criterion | Statement | Verification | Task |
|---|---|---|---|
| `AC-RPT-05-1` | Evidence uploads accept jpg, jpeg, png and mp4 up to 100 MB each and at most 5 files per request. | behavioral test | [TASK-009](../task/TASK-009.md) `[]` |
