---
task: TASK-067
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-067 — Web moderator shell, dashboard and profile

## What was built

The baseline moderator API client (`moderator.service.js`) is added, and the page shell treats every `/admin/*` and `/moderator/*` page except the standalone dashboards as a staff layout with its own main region.

## Acceptance criteria

- [ ] `AC-WEB-14-1` — not verified. Existing App tests for the moderator dashboard and role guards pass; the console navigation has no test.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Web tests | 48 tests in 6 suites pass (`.project/evidence/TASK-067/run-01/frontend-test.txt`). |
| Build | Production build with `CI=true` (warnings are errors) compiles (`.project/evidence/TASK-067/run-01/frontend-build.txt`). |
| Manual observation | `.project/evidence/TASK-067/run-01/manual-review.md`. |
| Static analysis | ESLint (react-app) runs inside the build; the backend complexity limits are not applied to migrated React pages. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

None.

## Known gaps

Locked-moderator denial and responsive behaviour were not observed. The moderator dashboard and profile pages were delivered earlier outside this record.

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
- `frontend/src/services/moderator.service.js`
- `docs/implement/IMPL-TASK-067.md`
- `.project/evidence/TASK-067/run-01/`
- `.project/state.json and generated views`
