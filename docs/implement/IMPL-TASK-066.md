---
task: TASK-066
execution_status: in_progress
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-066 — Web violation reports and disputes

## What was built

The listing detail gets a "report this listing" action that opens the baseline report dialog; the baseline dispute form used by the order pages is added.

## Acceptance criteria

- [ ] `AC-WEB-13-1` — not met. No automated test. Evidence files are still served from a public path (TASK-009), so "private assets are not exposed publicly" is not met.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-066/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-066/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-066/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None.

## Known gaps

Evidence is uploaded to a publicly served path, so the privacy part of the criterion fails until TASK-009 serves evidence through an authorised route. Submitting a report or a dispute was not observed.

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

- `frontend/src/modules/product/ProductDetail.css`
- `frontend/src/modules/product/ProductDetail.jsx`
- `frontend/src/modules/report/Dispute.css`
- `frontend/src/modules/report/Dispute.jsx`
- `frontend/src/modules/report/ReportProduct.jsx`
- `docs/implement/IMPL-TASK-066.md`
- `.project/evidence/TASK-066/run-01/`
- `.project/state.json and generated views`
