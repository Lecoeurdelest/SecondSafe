---
task: TASK-072
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-072 — Web admin disputes, withdrawals and revenue

## What was built

The baseline admin pages for disputes, withdrawals and the revenue report are added and routed. The revenue charts need `recharts`, which is added with its lockfile changes.

## Acceptance criteria

- [ ] `AC-WEB-19-1` — not verified. No automated test exercises these pages.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-072/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-072/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-072/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

`recharts` ^3.8.1 is a new dependency (the baseline version).

## Known gaps

Totals were only seen as zero. The dependency is added in this PR rather than in a separate dependency slice. Withdrawal approval depends on D-105 (TASK-029).

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

- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/src/modules/admin/AdminModules.css`
- `frontend/src/modules/admin/disputes/AdminDisputeDetail.jsx`
- `frontend/src/modules/admin/disputes/AdminDisputeList.jsx`
- `frontend/src/modules/admin/revenue/AdminRevenueReport.jsx`
- `frontend/src/modules/admin/withdrawals/AdminWithdrawalList.jsx`
- `frontend/src/routes/index.js`
- `docs/implement/IMPL-TASK-072.md`
- `.project/evidence/TASK-072/run-01/`
- `.project/state.json and generated views`
