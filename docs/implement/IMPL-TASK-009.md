---
task: TASK-009
execution_status: in_progress
relevance: current
date: 2026-11-10
author: Lecoeurdelest
---

# IMPL-TASK-009 — Media upload pipeline

## What was built

`POST /api/upload/image`, `/images` and `/evidence` now exist behind authentication. Each bucket has an allow-list of extensions, a size limit and a file-count limit. After multer stores a file, its first bytes are compared with the signature for its extension; a mismatch removes every file of the request and returns 400. Stored names are a timestamp plus sixteen random hex characters. The upload target becomes a directory only when it is an ObjectId; anything else falls back to `temp`, so a path can never be supplied.

## Acceptance criteria

- [x] `AC-PROD-02-1` — observed passing. tests/upload.test.js (formats, five-file limit, 5 MB limit, random names); integration section upload.
- [x] `AC-RPT-05-1` — observed passing. tests/upload.test.js (evidence formats). The 100 MB and five-file limits are the same multer limits exercised at 5 MB for images; a 100 MB file was not uploaded.
- [x] `AC-NFR-SEC-09-1` — observed passing. tests/upload.test.js (content that does not match the extension is rejected and removed); integration section upload.
- [ ] `AC-NFR-SEC-09-2` — not met. Not implemented: evidence files are stored under uploads/evidence and served by the public static route in app.js.

A checked box means the behaviour was observed in the recorded runs. No criterion is recorded as `pass` in `.project/state.json`: confidence is null because no calibrated evaluator exists, so the automatic gate stays inconclusive.

## Evidence

| Kind | Location or result |
|---|---|
| Backend tests | 215 tests in 27 suites pass (`.project/evidence/TASK-009/run-01/jest.txt`). |
| Integration | 7 checks, 0 failed, through the HTTP API against a disposable MongoDB 7.0.24 replica set; sections upload (`.project/evidence/TASK-009/run-01/integration.txt`). |
| Web build and tests | Not affected: no file under `frontend/` changes. |
| Static analysis | Complexity (cyclomatic ≤ 10, cognitive ≤ 15, nesting ≤ 3): no finding in the files of this task (`.project/evidence/TASK-009/run-01/complexity.txt`). |
| Model checks | Model validation, preservation audit, task-status audit, migration index and generated-view checks pass. |

## Deviations

The baseline accepted any file whose extension matched and trusted `productId` as a directory name. Both are tightened here. `webp` is not accepted because the criteria list jpg, jpeg, png and gif only.

## Known gaps

AC-NFR-SEC-09-2 is not met: dispute and report evidence is still reachable through the public `/uploads` static route by anyone who knows the random file name. Serving it through an authorised route also needs a web client change (TASK-066). Uploads are written to local disk, which does not persist on the Vercel serverless deployment.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-05` | yes | Uploading requires a session; serving evidence is still public (see known gaps) |
| `INV-06` | no | No credential data handled |

## Compatibility and supersession

The response shape `{ filename, path, size, mimetype }` and the three baseline paths are preserved, so the migrated web forms work unchanged.

## Files changed

- `backend/src/common/middlewares/upload.middleware.js`
- `backend/src/modules/products/upload.controller.js`
- `backend/src/modules/products/upload.route.js`
- `backend/tests/upload.test.js`
- `docs/implement/IMPL-TASK-009.md`
- `.project/evidence/TASK-009/run-01/`
- `.project/state.json and generated views`
