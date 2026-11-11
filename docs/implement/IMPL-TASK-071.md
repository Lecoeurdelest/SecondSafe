---
task: TASK-071
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-071 — Web admin order, review and report queues

## What was built

The baseline admin pages for reports, orders and reviews are added. The admin layout route becomes a pathless layout so `/admin/users` and the new pages share it. Admins get a header link to the queues.

## Acceptance criteria

- [ ] `AC-WEB-18-1` — not verified. No automated test exercises these pages.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-071/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-071/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-071/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The order detail shows the same status selector as the moderator page.

## Known gaps

No action was performed in the browser. The pages mirror the moderator pages and exceed the 500-line review aim.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | The client moves no money; it calls the API |
| `INV-05` | no | Visibility is enforced by the API |
| `INV-06` | no | — |
| `INV-08` | no | Amounts are displayed as received |

## Compatibility and supersession

Vietnamese product copy and the existing API paths are kept.

## Files changed

- `frontend/src/App.js`
- `frontend/src/modules/admin/orders/AdminOrderDetail.jsx`
- `frontend/src/modules/admin/orders/AdminOrderList.jsx`
- `frontend/src/modules/admin/reports/AdminReportDetail.jsx`
- `frontend/src/modules/admin/reports/AdminReportList.jsx`
- `frontend/src/modules/admin/reviews/AdminReviewList.jsx`
- `frontend/src/routes/index.js`
- `docs/implement/IMPL-TASK-071.md`
- `.project/evidence/TASK-071/run-01/`
- `.project/state.json and generated views`
