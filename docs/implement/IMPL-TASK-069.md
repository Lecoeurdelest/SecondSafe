---
task: TASK-069
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-069 — Web moderator disputes and withdrawals

## What was built

The baseline moderator pages for disputes and withdrawals are added and routed, the sidebar gains a withdrawals entry, and the staff dashboard links to the five queues instead of saying they are not enabled.

## Acceptance criteria

- [ ] `AC-WEB-16-1` — not verified. No automated test exercises these pages.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-069/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-069/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-069/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None.

## Known gaps

Settling a dispute and approving or rejecting a withdrawal were not performed in the browser. Withdrawal approval by moderators depends on D-105 (TASK-029).

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

- `frontend/src/modules/dashboard/Dashboard.jsx`
- `frontend/src/modules/moderator/disputes/ModDisputeDetail.jsx`
- `frontend/src/modules/moderator/disputes/ModDisputeList.jsx`
- `frontend/src/modules/moderator/layout/ModeratorSidebar.jsx`
- `frontend/src/modules/moderator/withdrawals/ModWithdrawalList.jsx`
- `frontend/src/routes/index.js`
- `docs/implement/IMPL-TASK-069.md`
- `.project/evidence/TASK-069/run-01/`
- `.project/state.json and generated views`
