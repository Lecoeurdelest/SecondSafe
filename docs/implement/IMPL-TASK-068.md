---
task: TASK-068
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-068 — Web moderator report, order and review queues

## What was built

The baseline moderator pages for reports, orders and reviews are added and routed under `/moderator`. The order detail offers the status correction control next to force-cancel; the baseline left the handler unused. Moderators get a header link to the queues.

## Acceptance criteria

- [ ] `AC-WEB-15-1` — not verified. No automated test exercises the queue pages.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-068/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-068/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-068/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The order detail shows a status selector built from the next statuses the API allows, excluding cancellation, which stays on the force-cancel action.

## Known gaps

No action (resolve, cancel, complete, hide, judge) was performed in the browser. The pages are the baseline files and exceed the 500-line review aim.

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
- `frontend/src/modules/moderator/orders/ModOrderDetail.jsx`
- `frontend/src/modules/moderator/orders/ModOrderList.jsx`
- `frontend/src/modules/moderator/reports/ModReportDetail.jsx`
- `frontend/src/modules/moderator/reports/ModReportList.jsx`
- `frontend/src/modules/moderator/reviews/ModReviewList.jsx`
- `frontend/src/routes/index.js`
- `docs/implement/IMPL-TASK-068.md`
- `.project/evidence/TASK-068/run-01/`
- `.project/state.json and generated views`
