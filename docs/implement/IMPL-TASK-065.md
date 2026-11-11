---
task: TASK-065
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-065 — Web seller reviews and ratings

## What was built

The baseline rating dialog (`RateSeller`) is added: stars, comment and optional evidence upload for the buyer of a completed order.

## Acceptance criteria

- [ ] `AC-WEB-12-1` — not verified. No automated test; the dialog is opened from the order detail, which is routed in TASK-063.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-065/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-065/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-065/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None.

## Known gaps

Not exercised at all in a browser or by a test. Public reviews on the profile pages were delivered earlier outside this record.

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

- `frontend/src/modules/review/RateSeller.css`
- `frontend/src/modules/review/RateSeller.jsx`
- `docs/implement/IMPL-TASK-065.md`
- `.project/evidence/TASK-065/run-01/`
- `.project/state.json and generated views`
