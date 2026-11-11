---
task: TASK-037
execution_status: verifying
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-037 — Violation reports

## What was built

Users report a listing or another user with a reason, a description and optional evidence. A reporter lists their own reports. Report detail depends on the reader: the reporter and staff get the whole report, the reported user gets it without the reporter, the reporter's evidence and the internal moderator fields, and anyone else gets 403. When a user reaches the configured number of non-dismissed reports the selling restriction is applied automatically, never to an admin. A shared `service-error.util.js` turns service errors into responses without leaking database messages.

## Acceptance criteria

- [x] `AC-RPT-01-1` — observed passing. tests/reports.test.js; integration section reports (reason list, 10 and 1000 character bounds, optional evidence).
- [x] `AC-RPT-01-2` — observed passing. tests/reports.test.js; integration section reports.
- [x] `AC-RPT-02-1` — observed passing. tests/reports.test.js; integration section reports.
- [x] `AC-RPT-03-1` — observed passing. tests/reports.test.js; integration section reports.
- [x] `AC-RPT-03-2` — observed passing. tests/reports.test.js; integration section reports (reporter and staff full view, reported user without reporter identity, others 403).
- [x] `AC-RPT-04-1` — observed passing. tests/reports.test.js; integration section reports (third open report restricts; admins never).

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 267 tests in 31 suites pass (`.project/evidence/TASK-037/run-01/jest.txt`). |
| Integration | 53 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload, listing, seller-listings, reviews, reports (`.project/evidence/TASK-037/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-037/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline let any signed-in user read any report. A user can report a listing once; the baseline allowed a new report after the previous one closed. Evidence must be files stored by the evidence upload endpoint.

## Known gaps

Resolving reports and listing every report are TASK-040.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-05` | yes | Report detail is limited by reader (tests/reports.test.js) |

## Compatibility and supersession

Baseline paths and success messages are kept. The threshold comes from `REPORT_RESTRICTION_THRESHOLD`.

## Files changed

- `backend/src/common/utils/service-error.util.js`
- `backend/src/modules/reports/report.controller.js`
- `backend/src/modules/reports/report.route.js`
- `backend/src/modules/reports/report.service.js`
- `backend/tests/reports.test.js`
- `docs/implement/IMPL-TASK-037.md`
- `.project/evidence/TASK-037/run-01/`
- `.project/state.json and generated views`
