---
task: TASK-040
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-040 — Report moderation and sanctions

## What was built

Moderators list and filter reports with statistics about the reported user and listing, open one, and resolve it as `resolved` or `dismissed` with a decision. `remove_content` removes the listing, `warn_user` counts a warning and restricts selling for 24 hours, 1 week or 1 year at 3, 6 and 9 warnings, `ban_user` restricts selling indefinitely, and `reply_feedback` only answers. The reporter and the reported user are notified. A moderator can also restrict a user directly with a reason. Keyword search treats the keyword as literal text.

## Acceptance criteria

- [x] `AC-MOD-02-1` — observed passing. tests/report-moderation.test.js (filters, literal keyword search); integration section report-moderation.
- [x] `AC-MOD-02-2` — observed passing. tests/report-moderation.test.js; integration section report-moderation.
- [x] `AC-MOD-02-3` — observed passing. tests/report-moderation.test.js (both parties notified; the moderator path delegates to the report service); integration section report-moderation (two notifications; /api/reports/:id/resolve also resolves).
- [x] `AC-MOD-03-1` — observed passing. tests/report-moderation.test.js (warnings 1, 3, 6 and 9 with configured durations); flow-review.md; integration section report-moderation.
- [x] `AC-MOD-03-2` — observed passing. tests/report-moderation.test.js (third warning removes the listing, remove_content, ban_user, admins exempt); flow-review.md; integration section report-moderation.
- [ ] `AC-MOD-07-1` — not verified. POST /api/moderator/users/:id/ban applies an indefinite selling restriction with a reason and refuses admins (tests/report-moderation.test.js, integration). The baseline endpoint restricts selling; it does not suspend the account, so whether this satisfies "suspend" is left to the owner.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 303 tests in 34 suites pass (`.project/evidence/TASK-040/run-01/jest.txt`). |
| Integration | 83 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports, disputes, revenue, report-moderation (`.project/evidence/TASK-040/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-040/run-01/complexity.txt`). |
| Flow review | `.project/evidence/TASK-040/run-01/flow-review.md`. |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline removed a listing at the fourth resolved warning because it did not count the report being resolved; it is now the third, as the criterion says. Thresholds and durations come from the business configuration. Keyword search no longer builds a regular expression from user input.

## Known gaps

AC-MOD-07-1: the baseline "ban" applies a selling restriction, not an account suspension. Audit logging of moderator actions is TASK-050.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | No money moves |
| `INV-03` | yes | Sanctions use the shared selling-restriction utility, which hides active listings |
| `INV-04` | yes | Admins are never warned, banned or restricted (tests/report-moderation.test.js) |
| `INV-07` | no | — |

## Compatibility and supersession

Baseline moderator paths and the report resolve path are kept and share one handler.

## Files changed

- `backend/src/modules/moderator/moderator.controller.js`
- `backend/src/modules/moderator/moderator.route.js`
- `backend/src/modules/moderator/moderator.service.js`
- `backend/src/modules/reports/report.controller.js`
- `backend/src/modules/reports/report.route.js`
- `backend/src/modules/reports/report.service.js`
- `backend/tests/report-moderation.test.js`
- `docs/implement/IMPL-TASK-040.md`
- `.project/evidence/TASK-040/run-01/`
- `.project/state.json and generated views`
