---
task: TASK-076
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-076 — Web abandoned checkout recovery

## What was built

Buyers see their unfinished checkouts above the order list and the cart, each with the one action that completes it (resume payment or buy again) and a dismiss button. The admin and staff dashboards show the recovery rate and the amounts recovered, waiting and lost. Both load on their own, so a failed request leaves the page underneath intact.

## Acceptance criteria

- [x] `AC-WEB-21-1` — observed passing. App tests "the cart page offers the buyer their unfinished checkouts and lets them dismiss one" and "staff dashboards show the abandoned checkout recovery summary" pass; the other dashboard tests run with a failing summary request and still render.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 50 tests in 6 suites pass (`.project/evidence/TASK-076/run-02/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-076/run-02/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-076/run-02/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None.

## Known gaps

The resume-payment link was not followed in the browser.

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

- `frontend/src/App.test.jsx`
- `frontend/src/modules/dashboard/Dashboard.jsx`
- `frontend/src/modules/order/AbandonedCheckouts.css`
- `frontend/src/modules/order/AbandonedCheckouts.jsx`
- `frontend/src/routes/index.js`
- `frontend/src/services/abandonedCheckout.service.js`
- `docs/implement/IMPL-TASK-076.md`
- `.project/evidence/TASK-076/run-02/`
- `.project/state.json and generated views`
